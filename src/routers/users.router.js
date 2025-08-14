import { Router } from "express";
import multer from "multer";
import {
  getUserProfileController,
  deleteUserProfileController,
  updateUserProfileController,
  changePasswordController,
  searchUsersController,
  bulkController,
  getUserByIdController,
} from "../controllers/users.controller.js";
import { authenticate } from "../middlewares/authorization.js";

const upload = multer({ storage: multer.memoryStorage() });

const usersRouter = Router();

// Получить профиль текущего пользователя
usersRouter.get("/profile", authenticate, getUserProfileController);

// Удалить профиль текущего пользователя
usersRouter.delete("/profile", authenticate, deleteUserProfileController);

// Обновить профиль текущего пользователя (с поддержкой загрузки изображения)
usersRouter.patch("/profile", authenticate, upload.single("profile_image"), updateUserProfileController);

// Изменить пароль пользователя
usersRouter.post("/change-password", authenticate, changePasswordController);

// Поиск пользователей
usersRouter.get("/search", searchUsersController);

// Обработка bulk-запроса пользователей
usersRouter.post("/bulk", bulkController);

// Получить пользователя по ID
usersRouter.get("/:id", getUserByIdController);

export default usersRouter;
