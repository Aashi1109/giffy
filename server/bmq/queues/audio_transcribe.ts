import { queueOptions } from "@bmq";
import { Queue } from "bullmq";

export const AUDIO_TRANSCRIBE_QUEUE_NAME = "Giffy__AudioTranscribe";
/**
 * Queue for transcribing audio files.
 * @type {Queue}
 */
const audioTranscribeQueue = new Queue(
  AUDIO_TRANSCRIBE_QUEUE_NAME,
  queueOptions
);

export default audioTranscribeQueue;
