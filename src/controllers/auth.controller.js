import crypto from "crypto";
import bcrypt from "bcrypt";
import * as authService from '../services/auth.service.js';
import validateBody from '../utils/validateBody.js';
import { registerSchema, loginSchema } from '../validation/auth.schema.js';

// Регистрация нового пользователя
export const registerController = async (req, res, next) => {
    try {
        await validateBody(registerSchema, req.body);
        await authService.register(req.body);
        res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        next(err);
    }
};

// Вход пользователя в систему
export const loginController = async (req, res, next) => {
    try {
        await validateBody(loginSchema, req.body);
        const result = await authService.login(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// Получение текущего пользователя по токену
export const getCurrentController = async (req, res, next) => {
    try {
        const result = await authService.getCurrent(req.user);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// Подтверждение email по коду
export const verifyEmailController = async (req, res, next) => {
    try {
        const { code } = req.body;
        const data = await authService.verifyEmail(code);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

// Выход пользователя (разлогин)
export const logoutController = async (req, res, next) => {
    try {
        req.user.token = null;
        await req.user.save();
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        next(err);
    }
};

// Повторная отправка письма с подтверждением email
export const resendVerificationController = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await authService.findByEmail(email);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                errors: [{ field: "email", message: "User not found" }],
            });
        }

        if (user.verify) {
            return res.status(400).json({
                message: "Email already verified",
                errors: [{ field: "email", message: "Email already verified" }],
            });
        }

        await authService.sendVerificationEmail(user.email, user.verificationCode);
        res.json({ message: "Verification email sent successfully" });
    } catch (err) {
        next(err);
    }
};

// Сброс пароля — отправка временного пароля на email
export const resetPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await authService.findByEmail(email);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                errors: [{ field: "email", message: "User not found" }],
            });
        }

        const tempPassword = crypto.randomBytes(4).toString("hex");
        user.passwordHash = await bcrypt.hash(tempPassword, 10);
        await user.save();

        await authService.sendResetPasswordEmail(user.email, tempPassword);
        res.json({ message: "Temporary password sent to your email" });
    } catch (err) {
        next(err);
    }
};
