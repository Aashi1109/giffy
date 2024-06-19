import { queueOptions } from "@bmq";
import { Queue } from "bullmq";

export const MEDIA_SPLIT_QUEUE_NAME = "Giffy__MediaSplit";
/**
 * Queue for splitting media based on audio segments and saving it.
 * @type {Queue}
 */
const mediaSplitQueue = new Queue(MEDIA_SPLIT_QUEUE_NAME, queueOptions);

export default mediaSplitQueue;
