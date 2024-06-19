import config from "@config";
import { Queue } from "bullmq";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};

export const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
};

export const queueOptions = { connection: redisOptions, defaultJobOptions };

//  we will have 3 queues and 3 worker for processing uploaded video files
// They are for following jobs,
// 1. Read and extract audio from video file
// 2. Transcribe audio file
// 3. Splitting video based on audio segments and save it
