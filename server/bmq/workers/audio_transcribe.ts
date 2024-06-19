import { redisOptions } from "@bmq";
import { mediaSplitQueue } from "@bmq/queues";
import { AUDIO_TRANSCRIBE_QUEUE_NAME } from "@bmq/queues/audio_transcribe";
import { transcribeAudio } from "@lib/helper";
import { getTranscriptionSegments, jnstringify } from "@lib/utils";
import logger from "@logger";
import { updateTask } from "@services/tasks";
import { EStatus } from "@types";

import { Job, Worker } from "bullmq";
import * as fs from "fs";

/**
 * Handles the processing of a job.
 * @param {Job} job - The job to process.
 * @returns {Promise<Object>} - The processed job data along with the transcriptions.
 * @throws {Error} - If the audio path is not found or invalid.
 */
const jobHandler = async (job: Job): Promise<object> => {
  logger.info(`Job started: ${job.name}`);
  logger.debug(`Job data: ${jnstringify(job.data)}`);

  const jobData = job.data;
  const { audioPath } = jobData || {};
  const isAudioPathValid = fs.existsSync(audioPath);
  if (!audioPath || !isAudioPathValid) {
    throw new Error(
      `Audio path not found or invalid. Failing job: ${job.name}`
    );
  }

  // Transcribe the audio file
  const transcriptions = await transcribeAudio(audioPath);
  logger.debug(`Transcriptions: ${jnstringify(transcriptions)}`);
  // Format the transcription segments
  const formattedSegments = getTranscriptionSegments(transcriptions as any);

  return { ...jobData, transcriptions: formattedSegments };
};

/**
 * Creates a new worker to process jobs from the audio transcribe queue.
 */
const worker = new Worker(AUDIO_TRANSCRIBE_QUEUE_NAME, jobHandler, {
  connection: redisOptions,
});

/**
 * Event listener for when a job is completed.
 * @param {Job} job - The completed job.
 * @param {any} returnValue - The return value from the completed job.
 */
worker.on("completed", async (job: Job, returnValue) => {
  logger.info(`Job completed: ${job.name}`);
  logger.debug(`Job data: ${jnstringify(job.data)}`);
  logger.debug(`Job return value: ${jnstringify(returnValue)}`);

  logger.info("Moving to video splitting stage");
  // Add the job to the video split queue
  await mediaSplitQueue.add(returnValue.filename + "__mediaSplit", returnValue);
});

/**
 * Event listener for when a job fails.
 * @param {Job} job - The failed job.
 * @param {Error} error - The error that caused the job to fail.
 */
worker.on("failed", async (job: Job, error: Error) => {
  logger.error(`Job failed: name: ${job.name} error: ${jnstringify(error)}`);
  const { id } = job.data || {};
  if (id) {
    // Update the task status to failed
    const updateTaskResult = await updateTask(id, {
      status: EStatus.Failed,
    });

    logger.info(`Task update result ${jnstringify(updateTaskResult)}`);
  }
});

/**
 * Event listener for worker errors.
 * @param {Error} error - The error that occurred.
 */
worker.on("error", (error: Error) => {
  logger.error(`Error processing job error: ${jnstringify(error)}`);
});

export default worker;
