import * as Yup from "yup";
import { passwordSchema, emailSchema } from "./users.schema.js";

export const registerSchema = Yup.object({
  email: emailSchema,
  fullname: Yup.string().trim().required("Full name is required"),
  username: Yup.string().trim().required("Username is required"),
  password: passwordSchema,
});

// Для логина — минимальные проверки, без требований к сложности пароля
export const loginSchema = Yup.object({
  email: emailSchema,
  password: Yup.string().trim().required("Password is required"),
});
