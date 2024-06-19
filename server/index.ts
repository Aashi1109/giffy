import {
  audioExtractQueue,
  audioTranscribeQueue,
  mediaSplitQueue,
} from "@bmq/queues";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import config from "@config";
import taskRouter from "@core/routes";
import logger from "@logger";
import { errorHandler } from "@middlewares/errorHandler";

import * as cors from "cors";
import * as express from "express";
import * as fs from "fs";
import helmet from "helmet";
import * as morgan from "morgan";

// import workers
import "@bmq/workers";

const app = express();
const serverAdapter = new ExpressAdapter();

app.use(morgan("dev"));
app.use(cors());
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(config.uploadFolders)) {
  fs.mkdirSync(config.uploadFolders);
}

createBullBoard({
  queues: [
    new BullMQAdapter(audioExtractQueue),
    new BullMQAdapter(audioTranscribeQueue),
    new BullMQAdapter(mediaSplitQueue),
  ],
  serverAdapter: serverAdapter,
});

serverAdapter.setBasePath("/admin");

app.get("/", (_, res) => {
  res.status(200).json({
    name: "Giffy API",
    version: "1.0.0",
    message: "Welcome to Gify API",
  });
});

app.use("/admin", serverAdapter.getRouter());

app.use("/api/giffytask", taskRouter);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});

// routes for gify tasks
app.use(errorHandler);

app.listen(config.port, config.host, () => {
  logger.info(`Server is running on ${config.host}:${config.port}`);
});
