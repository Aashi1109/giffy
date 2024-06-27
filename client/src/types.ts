export interface ITask {
  id: string;
  status: EStatus;
  originalFile: string;
  uploadStatus: EStatus;
  outputs: {
    id: number;
    text: string;
    video: { path: string; mimeType: "video/mp4" };
    audio: { path: string; mimeType: "audio/mp3" };
  }[];
}

export enum EStatus {
  Completed = "Completed",
  InProgress = "InProgress",
  Failed = "Failed",
}

export interface IAPIResponse {
  success: boolean;
}

export interface ITaskGetResponse extends IAPIResponse {
  data: ITask;
}

export interface ITaskCreateResponse extends IAPIResponse {
  data: { taskId: string };
}
