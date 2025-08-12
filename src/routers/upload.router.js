import { Router } from "express";
import { authenticate } from "../middlewares/authorization.js";
import { upload } from "../middlewares/upload.js";
import { uploadImageController } from "../controllers/upload.controller.js";

const uploadRouter = Router();

// Загрузка изображения
uploadRouter.post("/image", authenticate, upload.single("image"), uploadImageController);

export default uploadRouter;
