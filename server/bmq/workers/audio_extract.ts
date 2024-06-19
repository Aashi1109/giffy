import { redisOptions } from "@bmq";
import { audioTranscribeQueue } from "@bmq/queues";
import { AUDIO_EXTRACT_QUEUE_NAME } from "@bmq/queues/audio_extract";
import { convertVideoToAudio } from "@lib/helper";
import { getUUIDv4, jnstringify } from "@lib/utils";
import logger from "@logger";
import { updateTask } from "@services/tasks";
import { EStatus } from "@types";

import { Job, Worker } from "bullmq";
import * as path from "path";

/**
 * Handles the processing of a job.
 * @param {Job} job - The job to process.
 * @returns {Promise<any>} - The processed job data along with the audio path.
 * @throws {Error} - If the file path is not specified or audio extraction fails.
 */
const jobHandler = async (job: Job): Promise<any> => {
  try {
    logger.info(`Processing job ${job.name}, data: ${jnstringify(job.data)}`);
    const jobData = job.data;

    const { filepath, id } = jobData ?? {};

    if (!filepath) {
      throw new Error(`File path not specified: ${filepath}`);
    }

    const baseFolderPath = path.dirname(filepath);
    const audioOutputPath = path.join(baseFolderPath, getUUIDv4() + ".mp3");

    // Wrap the convertVideoToAudio call in a Promise to ensure proper await behavior
    const audioOutput = await convertVideoToAudio(filepath, audioOutputPath);

    logger.info(`Conversion output: ${audioOutput}`);
    return { ...jobData, audioPath: audioOutputPath };
  } catch (error) {
    logger.error(jnstringify(error));
    throw error;
  }
};

/**
 * Creates a new worker to process jobs from the audio extract queue.
 */
const worker = new Worker(AUDIO_EXTRACT_QUEUE_NAME, jobHandler, {
  connection: redisOptions,
  autorun: true,
});

/**
 * Event listener for when a job is completed.
 * @param {Job} job - The completed job.
 * @param {any} returnValue - The return value from the completed job.
 */
worker.on("completed", async (job: Job, returnValue) => {
  const { audioPath } = returnValue || {};
  if (audioPath) {
    // Add the job to the audio transcribe queue
    await audioTranscribeQueue.add(
      returnValue?.filename + "__audioTranscribe",
      { ...returnValue }
    );
  }
  logger.info(`Job completed: ${job.name}`);
});

/**
 * Event listener for when a job fails.
 * @param {Job} job - The failed job.
 * @param {Error} error - The error that caused the job to fail.
 */
worker.on("failed", async (job: Job, error: Error) => {
  const { id } = job.data ?? {};
  if (id) {
    // Update the task status to failed
    const updateTaskResult = await updateTask(id, {
      status: EStatus.Failed,
    });

    logger.info(`Task update result: ${jnstringify(updateTaskResult)}`);
  }

  logger.error(`Job failed: ${job.name}, error: ${jnstringify(error)}`);
});

/**
 * Event listener for worker errors.
 * @param {Error} error - The error that occurred.
 */
worker.on("error", (error: Error) => {
  logger.error("Error while processing job: ", jnstringify(error));
});

export default worker;
