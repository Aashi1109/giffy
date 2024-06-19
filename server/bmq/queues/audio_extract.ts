import { queueOptions } from "@bmq";
import { Queue } from "bullmq";

export const AUDIO_EXTRACT_QUEUE_NAME = "Giffy__AudioExtract";
/**
 * Queue for extracting audio from video files.
 * @type {Queue}
 */
const audioExtractQueue = new Queue(AUDIO_EXTRACT_QUEUE_NAME, queueOptions);

export default audioExtractQueue;
