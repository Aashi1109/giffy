export interface ITask {
  id: string;
  status: EStatus;
  originalFile: string;
  uploadStatus: EStatus;
  outputs: {
    id: number;
    text: string;
    video: { path: string; mimeType: "video/mp4"; base64: string };
    audio: { path: string; mimeType: "audio/mp3"; base64: string };
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
