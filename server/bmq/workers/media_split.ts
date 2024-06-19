import { redisOptions } from "@bmq";
import { MEDIA_SPLIT_QUEUE_NAME } from "@bmq/queues/media_split";
import { splitMedia } from "@lib/helper";
import { jnstringify } from "@lib/utils";
import logger from "@logger";
import { updateTask } from "@services/tasks";
import { EStatus } from "@types";
import { Job, Worker } from "bullmq";

/**
 * Handles the processing of a job.
 * @param {Job} job - The job to process.
 * @returns {Promise<any>} - The processed job data along with the outputs.
 * @throws {Error} - If required job data is missing.
 */
const jobHandler = async (job: Job): Promise<any> => {
  logger.info(`Job started :${job.name}`);
  const jobData = job.data;

  const { filepath: videoPath, audioPath, transcriptions, id } = jobData || {};

  if (!videoPath && !audioPath && !transcriptions) {
    throw new Error(
      `Job ${job.name} doesn't have the required data to process. Failing job ${
        job.name
      }. Passed data: ${JSON.stringify(jobData)}`
    );
  }

  // Splits the media based on the provided video path, audio path, and transcriptions
  const outputs = await splitMedia(videoPath, audioPath, transcriptions, id);

  logger.info(`Media split results: ${jnstringify(outputs)}`);
  return { ...jobData, outputs };
};

/**
 * Creates a new worker to process jobs from the video split queue.
 */
const worker = new Worker(MEDIA_SPLIT_QUEUE_NAME, jobHandler, {
  connection: redisOptions,
});

/**
 * Event listener for when a job is completed.
 * @param {Job} job - The completed job.
 * @param {Object} returnValue - The return value from the completed job.
 */
worker.on("completed", async (job: Job, returnValue) => {
  logger.info(`Job completed : ${job.name}`);
  const { id } = returnValue || {};
  if (id) {
    const updateTaskResult = await updateTask(id, {
      status: EStatus.Completed,
      uploadStatus: EStatus.Completed,
      outputs: returnValue?.outputs || {},
    });

    logger.info(`Task update result ${jnstringify(updateTaskResult)}`);
  }
});

/**
 * Event listener for when a job fails.
 * @param {Job} job - The failed job.
 * @param {Error} returnValue - The returned error from the failed job.
 */
worker.on("failed", async (job: Job, failError: Error) => {
  logger.error(`Job failed ${job.name} error: ${jnstringify(failError)}`);
  const { id } = job.data || {};
  if (id) {
    const updateTaskResult = await updateTask(id, {
      status: EStatus.Failed,
      uploadStatus: EStatus.Failed,
    });

    logger.info(`Task update result ${jnstringify(updateTaskResult)}`);
  }
});

/**
 * Event listener for worker errors.
 * @param {Error} error - The error that occurred.
 */
worker.on("error", (error: Error) => {
  logger.error(`Worker error ${jnstringify(error)}`);
});

export default worker;
