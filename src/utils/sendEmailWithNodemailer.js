import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { MAIL_PASSWORD, MAIL_EMAIL } = process.env;

// Конфигурация транспорта для nodemailer
const nodemailerConfig = {
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
        user: MAIL_EMAIL,
        pass: MAIL_PASSWORD,
    },
};

const transport = nodemailer.createTransport(nodemailerConfig);

/**
 * Отправляет email через nodemailer
 * @param {Object} data
 * @param {string|string[]} data.to - email или массив email получателей
 * @param {string} data.subject - тема письма
 * @param {string} [data.text] - текстовая версия письма (необязательно)
 * @param {string} data.html - html версия письма
 * @returns {Promise} - Promise, который резолвится при успешной отправке
 */

function sendEmailWithNodemailer(data) {
    const email = {
        from: MAIL_EMAIL,
        ...data,
    };
    return transport.sendMail(email);
}

export default sendEmailWithNodemailer;