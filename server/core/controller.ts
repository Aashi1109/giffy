import { audioExtractQueue } from "@bmq/queues";
import config from "@config";
import { ClientError } from "@exceptions";
import { getUUIDv4, jnstringify } from "@lib/utils";
import logger from "@logger";
import { createTask, getTask } from "@services/tasks";
import { EStatus, ITask } from "@types";
import * as busboy from "busboy";
import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";

export const submitNewGifyTask = async (req: Request, res: Response) => {
  logger.info("Request received: " + req.path);
  const bb = busboy({ headers: req.headers });

  let taskId = null;

  bb.on("file", (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    logger.info(`File data: ${jnstringify(info)}`);

    if (!mimeType.startsWith("video/")) {
      throw new ClientError(
        `Unsupported file type: ${mimeType}. Only videos are allowed.`
      );
    }

    const destinationFolder = config.uploadFolders;
    const uniqueSuffix = getUUIDv4();

    taskId = uniqueSuffix;
    const suffixedUploadFolder = path.join(destinationFolder, uniqueSuffix);

    if (!fs.existsSync(suffixedUploadFolder)) {
      fs.mkdirSync(suffixedUploadFolder);
    }

    // Save file to disk with original filename
    const saveTo = path.join(suffixedUploadFolder, filename);
    logger.info(`Saving file to: ${saveTo}`);

    const writeStream = fs.createWriteStream(saveTo);

    file.pipe(writeStream);

    const taskData: ITask = {
      id: uniqueSuffix,
      status: EStatus.InProgress,
      originalFile: saveTo,
      outputs: null,
    };

    writeStream.on("finish", async () => {
      logger.debug("Saving task");
      try {
        const taskCreateResult = await createTask(taskData);
        logger.debug(`Task created: ${jnstringify(taskCreateResult)}`);
      } catch (error) {
        logger.error(`Error creating task data: ${error}`);
      }

      logger.debug("Sending for audio extraction");

      await audioExtractQueue.add(filename + "__audioExtraction", {
        id: uniqueSuffix,
        filename,
        filepath: saveTo,
        mimeType,
        encoding,
      });
    });
  });

  bb.on("finish", () => {
    logger.info("File upload complete");
    return res.json({
      success: true,
      message: "Giffy task created successfully",
      data: { taskId: taskId },
    });
  });
  req.pipe(bb);
};

export const getGifyTask = async (req: Request, res: Response) => {
  logger.info(`Request received : ${req.path}`);
  const { id } = req.params;

  const existingTaskResponse = await getTask(id);
  if (existingTaskResponse) {
    // if status is completed then return base64 of files
    const isCompleted = existingTaskResponse.status === EStatus.Completed;
  }
  return res
    .status(200)
    .json({ success: !!existingTaskResponse, data: existingTaskResponse });
};
