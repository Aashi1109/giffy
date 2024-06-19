export interface ITask {
  id: string;
  status: EStatus;
  uploadStatus?: EStatus;
  originalFile: string;
  outputs: {
    id: number;
    video: { path: string; mimeType: "video/mp4" };
    audio: { path: string; mimeType: "audio/mp3" };
  }[];
}

export enum EStatus {
  Completed = "Completed",
  InProgress = "InProgress",
  Failed = "Failed",
}

export interface ICloudinaryImageUploadOptions {
  user_filename?: boolean;
  unique_filename?: boolean;
  overwrite?: boolean;
  resource_type?: string | any;
  folder?: string;
}
