import asyncHandler from "@middlewares/asyncHandler";
import * as express from "express";
import { getGifyTask, submitNewGifyTask } from "./controller";
const router = express.Router();

router.post("", asyncHandler(submitNewGifyTask));
router.get("/:id", asyncHandler(getGifyTask));

export default router;
