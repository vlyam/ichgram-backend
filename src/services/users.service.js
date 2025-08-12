import User from "../db/User.js";

// Поиск пользователя по ID
export const findUserById = async (id) => {
  return await User.findById(id);
};

// Возвращает безопасные данные пользователя, без приватных полей
export const getSafeUserData = (user) => {
  if (!user) return null;

  // Удаляем приватные поля из объекта пользователя
  const { passwordHash, verificationCode, token, ...safeData } = user.toObject();
  return safeData;
};
