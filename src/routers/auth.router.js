import { Router } from "express";
import {
  registerController,
  resendVerificationController,
  loginController,
  resetPasswordController,
  getCurrentController,
  verifyEmailController,
  logoutController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authorization.js";

// Инициализация роутера авторизации
const authRouter = Router();

// Регистрация нового пользователя
authRouter.post("/register", registerController);

// Повторная отправка письма для подтверждения email
authRouter.post("/resend-verification", resendVerificationController);

// Сброс пароля
authRouter.post("/reset", resetPasswordController);

// Вход пользователя
authRouter.post("/login", loginController);

// Получить данные текущего пользователя
authRouter.get("/me", authenticate, getCurrentController);

// Подтверждение email
authRouter.post("/verify", verifyEmailController);

// Выход пользователя
authRouter.post("/logout", authenticate, logoutController);

export default authRouter;
