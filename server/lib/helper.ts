import * as ffmpegPath from "@ffmpeg-installer/ffmpeg";
import * as ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import OpenAI from "openai";
import * as path from "path";

import config from "@config";
import logger from "@logger";
import { updateTask } from "@services/tasks";
import { EStatus } from "@types";
import { uploadFileToCloudinary } from "./cloudinary";
import { jnparse, jnstringify } from "./utils";

// setups
ffmpeg.setFfmpegPath(ffmpegPath.path);
const _openai = new OpenAI({
  apiKey: config.openaiKey,
});

/**
 * Reads a JSON file synchronously and returns the parsed object.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Object} - The parsed JSON object.
 */
export const readJsonFileSync = (filePath) => {
  try {
    const data = fs.readFileSync(path.resolve(filePath), "utf8");
    return jnparse(data);
  } catch (err) {
    console.error("Error reading JSON file:", err);
    throw err;
  }
};

/**
 * Converts video to audio format
 * @param {string} input - Path of input file
 * @param {string} output - Path of output file
 * @param {Function} callback - Node-style callback fn (error, result)
 */
export function convertVideoToAudio(
  input: string,
  output: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .on("end", () => {
        console.log("Conversion ended");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error during conversion:", err.message);
        reject(err);
      })
      .run();
  });
}

export const waitFor = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(delay);
    }, delay);
  });
};

export const retryPromises = async (
  promise: Promise<any>,
  retryCount = config.maxRetry
) => {
  const _retryPromise = async (_retryCount: number) => {
    try {
      return await promise;
    } catch (error) {
      logger.error("Error resolving promise: ", error);

      // retry the promise here
      if (_retryCount == 0) {
        throw error;
      }
      // get current number
      const current = retryCount + 1 - _retryCount;
      logger.info("Retrying... Attempt: ", current);
      // add wait for each retry called
      await waitFor(current * config.retryExponentialMultipler);

      return _retryPromise(_retryCount - 1);
    }
  };

  return _retryPromise(retryCount);
};

/**
 * Transcribes audio into text format
 * @param audioFilePath Path of audio file
 * @returns Transcription result from openi
 */
export async function transcribeAudio(audioFilePath: string) {
  try {
    const transcription = await _openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
      prompt:
        "Make segments in transcription strictly on meaningful sentences and on pauses.",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    return transcription;
  } catch (error) {
    logger.error(
      `Error transcribing audio file: ${audioFilePath}, error: ${jnstringify(
        error?.message
      )}`
    );
    throw error;
  }
}

/**
 * Splits a video into segments based on transcriptions, extracts audio, and uploads to cloud storage.
 * @param {string} videoPath - Path to the original video file.
 * @param {string} audioPath - Path to the original audio file.
 * @param {any[]} transcriptions - Array of transcription objects containing start, end, and text.
 * @param {string} taskId - ID of the task related to this media splitting process.
 * @returns {Promise<object[]>} - Array of objects representing output paths and metadata.
 */
export async function splitMedia(videoPath, audioPath, transcriptions, taskId) {
  try {
    const baseOutputPath = path.dirname(videoPath);
    const videoDir = path.join(baseOutputPath, "video");
    const audioDir = path.join(baseOutputPath, "audio");

    createOutputDirectories(videoDir, audioDir);

    const outputPaths = [];

    for (const transcription of transcriptions) {
      if (!transcription?.text) continue;

      const { id, start, end, text } = transcription;
      const duration = Math.ceil(end - start);

      const outputVideoPath = path.join(videoDir, `video_${id}.mp4`);
      const outputAudioPath = path.join(audioDir, `audio_${id}.mp3`);

      await processTranscription(
        videoPath,
        audioPath,
        outputVideoPath,
        outputAudioPath,
        start,
        duration,
        id
      );

      const promiseOutputs = await uploadMediaSegments(
        [outputVideoPath, outputAudioPath],
        taskId
      );

      outputPaths.push({
        id,
        text,
        video: {
          path: promiseOutputs?.length ? promiseOutputs[0]?.secure_url : "",
          mimeType: "video/mp4",
        },
        audio: {
          path: promiseOutputs?.length ? promiseOutputs[1]?.secure_url : "",
          mimeType: "audio/mp3",
        },
      });

      await updateTaskStatus(taskId, outputPaths, EStatus.InProgress);
    }

    await updateTaskStatus(taskId, outputPaths, EStatus.Completed);

    return outputPaths;
  } catch (error) {
    logger.error(`Error splitting media ${error}`);
  } finally {
    cleanupTaskUpload(taskId);
  }
}

/**
 * Creates output directories if they do not exist.
 * @param {string} videoDir - Path to the directory for video outputs.
 * @param {string} audioDir - Path to the directory for audio outputs.
 */
function createOutputDirectories(videoDir, audioDir) {
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir);
  }
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir);
  }
}

/**
 * Processes a transcription to extract video and audio segments.
 * @param {string} videoPath - Path to the original video file.
 * @param {string} audioPath - Path to the original audio file.
 * @param {string} outputVideoPath - Output path for the video segment.
 * @param {string} outputAudioPath - Output path for the audio segment.
 * @param {number} start - Start time of the segment (in seconds).
 * @param {number} duration - Duration of the segment (in seconds).
 * @param {string} transcriptionId - ID of the transcription.
 */
async function processTranscription(
  videoPath,
  audioPath,
  outputVideoPath,
  outputAudioPath,
  start,
  duration,
  transcriptionId
) {
  await extractVideoSegment(
    videoPath,
    outputVideoPath,
    start,
    duration,
    transcriptionId
  );
  await extractAudioSegment(
    audioPath,
    outputAudioPath,
    start,
    duration,
    transcriptionId
  );
}

/**
 * Extracts a video segment from the original video file.
 * @param {string} videoPath - Path to the original video file.
 * @param {string} outputVideoPath - Output path for the video segment.
 * @param {number} start - Start time of the segment (in seconds).
 * @param {number} duration - Duration of the segment (in seconds).
 * @param {string} transcriptionId - ID of the transcription.
 */
async function extractVideoSegment(
  videoPath,
  outputVideoPath,
  start,
  duration,
  transcriptionId
) {
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(start)
      .setDuration(duration)
      .output(outputVideoPath)
      .videoCodec("libx264") // Set video codec to libx264
      .audioCodec("aac") // Set audio codec to aac
      .on("end", () => {
        logger.info(`Video segment ${transcriptionId} created`);
        resolve(outputVideoPath);
      })
      .on("error", (err) => {
        logger.error(
          `Error creating video segment ${transcriptionId}: ${err.message}`
        );
        reject(err);
      })
      .run();
  });
}

/**
 * Extracts an audio segment from the original audio file.
 * @param {string} audioPath - Path to the original audio file.
 * @param {string} outputAudioPath - Output path for the audio segment.
 * @param {number} start - Start time of the segment (in seconds).
 * @param {number} duration - Duration of the segment (in seconds).
 * @param {string} transcriptionId - ID of the transcription.
 */
async function extractAudioSegment(
  audioPath,
  outputAudioPath,
  start,
  duration,
  transcriptionId
) {
  await new Promise((resolve, reject) => {
    ffmpeg(audioPath)
      .setStartTime(start)
      .setDuration(duration)
      .output(outputAudioPath)
      .on("end", () => {
        logger.info(`Audio segment ${transcriptionId} created`);
        resolve(outputAudioPath);
      })
      .on("error", (err) => {
        logger.error(
          `Error creating audio segment ${transcriptionId}: ${err.message}`
        );
        reject(err);
      })
      .run();
  });
}

/**
 * Uploads media segments to cloud storage.
 * @param {string[]} paths - Array of paths to media segments.
 * @param {string} taskId - ID of the task related to media uploading.
 * @returns {Promise<object[]>} - Array of objects representing uploaded media metadata.
 */
async function uploadMediaSegments(paths, taskId) {
  return await Promise.all(
    paths.map((filepath) =>
      retryPromises(uploadFileToCloudinary(filepath, taskId))
    )
  );
}

/**
 * Updates the status of a task.
 * @param {string} taskId - ID of the task to update.
 * @param {object[]} outputPaths - Array of output paths and metadata.
 * @param {EStatus} status - Status to update the task with.
 */
async function updateTaskStatus(taskId, outputPaths, status) {
  try {
    const updateResp = await updateTask(taskId, {
      outputs: outputPaths,
      uploadStatus: status,
    });
    logger.debug(`Updated task ${jnstringify(updateResp)}`);
  } catch (error) {
    logger.error(`Error updating task ${jnstringify(error)}`);
  }
}

/**
 * Cleans up task upload folder.
 * @param {string} taskId - ID of the task whose upload folder needs cleanup.
 */
function cleanupTaskUpload(taskId) {
  const taskUploadPath = path.join(config.uploadFolders, taskId);
  if (fs.existsSync(taskUploadPath)) {
    logger.debug(
      `Removing upload folder for taskId:${taskId} -> ${taskUploadPath}`
    );
    fs.rmSync(taskUploadPath, { recursive: true, force: true });
  }
}
