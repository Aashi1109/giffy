import config from "@/config";
import { ITaskCreateResponse, ITaskGetResponse } from "@/types";

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
    const response = await fetch(`/api/giffytask/${taskId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error(`Error getting task ${error}`);
  }
};
