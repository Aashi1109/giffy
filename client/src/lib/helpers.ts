import config from "@/config";
import { ITaskCreateResponse, ITaskGetResponse } from "@/types";

import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { saveAs } from "file-saver";

export const waitFor = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(delay);
    }, delay);
  });
};

export const retryPromises = async <T>(
  promise: Promise<T>,
  retryCount = config.maxRetry
) => {
  const _retryPromise = async (_retryCount: number): Promise<T> => {
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

export const uploadVideoForGifGeneration = async (
  formdata: FormData
): Promise<ITaskCreateResponse | null | undefined> => {
  try {
    ("use server");
    const uploadResponse = await fetch("/api/giffytask", {
      method: "POST",
      body: formdata,
    });
    if (uploadResponse.ok) {
      return await uploadResponse.json();
    }
    return null;
  } catch (error) {
    console.error(`Error uploading video ${error}`);
    throw error;
  }
};

export const getTaskData = async (
  taskId: string
): Promise<ITaskGetResponse | null | undefined> => {
  try {
    ("use server");
    const response = await fetch(`/api/giffytask/${taskId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error(`Error getting task ${error}`);
  }
};

/**
 * Converts a video file to a GIF with optional scaling.
 *
 * @param {string | Blob} videoUrl - URL or Blob of the video file to be converted.
 * @param {string} fileName - Name for the output GIF file.
 * @param {number} [width=320] - Width for the output GIF. Defaults to 320 pixels.
 * @param {number} [height=-1] - Height for the output GIF. Defaults to -1 to maintain aspect ratio.
 * @returns {Promise<void>} - A promise that resolves when the conversion is complete.
 *
 * @example
 * Convert video to GIF with default dimensions
 * convertToGif('path/to/video.mp4', 'output');
 *
 * @example
 * Convert video to GIF with custom dimensions
 * convertToGif('path/to/video.mp4', 'output', 320, 240);
 */
export const convertToGif = async (
  videoUrl: string | Blob,
  fileName: string,
  width: number = 320,
  height: number = -1 // -1 to maintain aspect ratio
): Promise<void> => {
  try {
    const ffmpeg = createFFmpeg({ log: false });
    await ffmpeg.load();

    await ffmpeg.FS("writeFile", fileName, await fetchFile(videoUrl));
    await ffmpeg.run(
      "-i",
      fileName,
      "-vf",
      `scale=${width}:${height}`,
      "-f",
      "gif",
      `${fileName}.gif`
    );
    const data = ffmpeg.FS("readFile", `${fileName}.gif`);
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: "image/gif" })
    );
    saveAs(url, `${fileName}.gif`);
  } catch (error) {
    console.error(`Error converting video to gif: ${error}`);
  }
};
