import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../db/User.js";
import HttpExeption from "../utils/HttpExeption.js";
import { nanoid } from "nanoid";
import sendEmailWithNodemailer from "../utils/sendEmailWithNodemailer.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Создает JWT токен с id пользователя и временем жизни 24 часа
const createToken = (user) => {
    const payload = { id: user._id };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

// Регистрация нового пользователя
export const register = async ({ email, fullname, username, password }) => {
    // Проверяем, есть ли пользователь с таким email
    const existing = await User.findOne({ email });
    if (existing) {
        // Формируем ошибку с полем и сообщением для фронтенда
        const error = HttpExeption(409, `Email ${email} already in use`);
        error.errors = [{ field: "email", message: `Email ${email} already in use` }];
        throw error;
    }

    // Хэшируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Генерируем код верификации
    const verificationCode = nanoid();

    // Создаём нового пользователя в БД
    const newUser = await User.create({
        email,
        fullname,
        username,
        passwordHash,
        verificationCode,
        verify: false,
    });

    // Формируем письмо с ссылкой для подтверждения email
    const verifyEmail = {
        to: email,
        subject: "Please verify your email",
        html: `<p>Please click this link to verify your email:</p>
           <a href="${process.env.FRONTEND_URL}/verify?code=${verificationCode}" target="_blank">
             Verify Email
           </a>`,
    };

    // Отправляем письмо
    await sendEmailWithNodemailer(verifyEmail);

    // Возвращаем успешное сообщение и ID нового пользователя
    return {
        message: "Registration successful. Please verify your email before logging in.",
        userId: newUser._id,
    };
};

// Подтверждение Email
export const verifyEmail = async (code) => {
    // Находим пользователя по коду верификации
    const user = await User.findOne({ verificationCode: code });
    if (!user) {
        throw HttpExeption(400, "Invalid or expired verification code");
    }

    // Отмечаем пользователя как подтверждённого
    user.verify = true;
    user.verificationCode = "";
    await user.save();

    return { message: "Email successfully verified" };
};

// Авторизация пользователя

export const login = async ({ email, password }) => {
    // Ищем пользователя по email
    const user = await User.findOne({ email });

    // Всегда возвращаем одинаковую ошибку, чтобы не раскрывать информацию
    if (!user) throw HttpExeption(401, "Invalid email or password");

    // Проверяем, подтвердил ли пользователь email
    if (!user.verify) throw HttpExeption(401, "Please verify your email before login");

    // Проверяем пароль
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw HttpExeption(401, "Invalid email or password");

    // Создаём JWT токен и сохраняем в базе (если логика нужна)
    const token = createToken(user);
    user.token = token;
    await user.save();

    return {
        token,
        user: {
            id: user._id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
        },
    };
};

// Найти пользователя по email
export const findByEmail = async (email) => {
    return await User.findOne({ email });
};

// Отправить письмо с подтверждением email
export const sendVerificationEmail = async (email, code) => {
    const verifyEmail = {
        to: email,
        subject: "Please verify your email",
        html: `<p>Please click this link to verify your email:</p>
           <a href="${process.env.FRONTEND_URL}/verify?code=${code}" target="_blank">Verify Email</a>`,
    };
    await sendEmailWithNodemailer(verifyEmail);
};

// Отправить временный пароль для сброса пароля
export const sendResetPasswordEmail = async (email, tempPassword) => {
    const resetEmail = {
        to: email,
        subject: "Your temporary password",
        html: `<p>Your temporary password: <b>${tempPassword}</b></p>
           <p>Please log in and change your password immediately.</p>`,
    };
    await sendEmailWithNodemailer(resetEmail);
};

// Получить актуальные данные текущего пользователя из базы
export const getCurrent = async (user) => {
    const freshUser = await User.findById(user._id).select(
        "email username fullname profile_image"
    );

    return {
        user: {
            id: freshUser._id,
            email: freshUser.email,
            username: freshUser.username,
            fullname: freshUser.fullname,
            profile_image: freshUser.profile_image || null,
        },
    };
};

// Логаут, пока пустая функция, т.к. токены очищаются на клиенте
export const logout = async () => { };
