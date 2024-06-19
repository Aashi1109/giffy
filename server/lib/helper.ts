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
      console.error("Error resolving promise: ", error);

      // retry the promise here
      if (_retryCount == 0) {
        throw error;
      }
      // get current number
      const current = retryCount + 1 - _retryCount;
      console.log("Retrying... Attempt: ", current);
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
 * Given an audio file,video file and transcriptions for the same splits them into segments.
 * @param videoPath Path of video file
 * @param audioPath Path of audio file
 * @param transcriptions Transcriptions generated using audio file
 * @param transcriptions ID of the current task
 * @returns List of paths of slitted video and audio based on transcriptions segments
 */
export async function splitMedia(
  videoPath: string,
  audioPath: string,
  transcriptions: any,
  taskId: string
) {
  try {
    const baseOutputPath = path.dirname(videoPath);

    const videoDir = path.join(baseOutputPath, "video");
    const audioDir = path.join(baseOutputPath, "audio");

    // create output directory for audio and video files
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir);
    }
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir);
    }

    const outputPaths = [];

    for (const transcription of transcriptions) {
      const start = transcription.start;
      const end = transcription.end;
      const duration = Math.ceil(end - start);

      const text = transcription?.text;

      if (!text) {
        continue;
      }

      const outputVideoPath = path.join(
        videoDir,
        `video_${transcription.id}.mp4`
      );
      const outputAudioPath = path.join(
        audioDir,
        `audio_${transcription.id}.mp3`
      );

      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .setStartTime(start)
          .setDuration(duration)
          .output(outputVideoPath)
          .videoCodec("libx264") // Set video codec
          .audioCodec("aac") // Set audio codec
          .on("end", () => {
            logger.info(`Video segment ${transcription.id} created`);
            resolve(outputVideoPath);
          })
          .on("error", (err) => {
            logger.error(
              `Error creating video segment ${transcription.id}: ${err.message}`
            );
            reject(err);
          })
          .run();
      });

      await new Promise((resolve, reject) => {
        ffmpeg(audioPath)
          .setStartTime(start)
          .setDuration(duration)
          .output(outputAudioPath)
          .on("end", () => {
            logger.info(`Audio segment ${transcription.id} created`);
            resolve(outputAudioPath);
          })
          .on("error", (err) => {
            logger.error(
              `Error creating audio segment ${transcription.id}: ${err.message}`
            );
            reject(err);
          })
          .run();
      });

      logger.debug(`Uploading media segments ${transcription.id}`);
      const uploadPromises = [outputVideoPath, outputAudioPath].map(
        (filepath) => retryPromises(uploadFileToCloudinary(filepath, taskId))
      );

      const promiseOutputs = await Promise.all(uploadPromises);
      logger.debug(`Media segments uploaded ${jnstringify(promiseOutputs)}`);

      outputPaths.push({
        id: transcription.id,
        text: transcription?.text ?? "",
        video: {
          path: promiseOutputs?.length ? promiseOutputs[0]?.secure_url : "",
          mimeType: "video/mp4",
        },
        audio: {
          path: promiseOutputs?.length ? promiseOutputs[1]?.secure_url : "",
          mimeType: "audio/mp3",
        },
      });

      // update json with this current information
      try {
        const updateResp = await updateTask(taskId, {
          outputs: outputPaths,
          uploadStatus: EStatus.InProgress,
        });
        logger.debug(`Updated task ${jnstringify(updateResp)}`);
      } catch (error) {
        logger.error(`Error updating task ${jnstringify(error)}`);
      }
    }

    try {
      const updateResp = await updateTask(taskId, {
        outputs: outputPaths,
        uploadStatus: EStatus.Completed,
      });
      logger.debug(`Updated task ${jnstringify(updateResp)}`);
    } catch (error) {
      logger.error(`Error updating task ${jnstringify(error)}`);
    }

    return outputPaths;
  } catch (error) {
    logger.error(`Error splitting media ${error}`);
  } finally {
    const taskUploadPath = path.join(config.uploadFolders, taskId);
    if (fs.existsSync(taskUploadPath)) {
      logger.debug(
        `Removing upload folder for taskId:${taskId} -> ${taskUploadPath}`
      );
      fs.rmSync(taskUploadPath, { recursive: true, force: true });
    }
  }
}
