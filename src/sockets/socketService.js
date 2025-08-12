// Singleton для io-инстанса Socket.IO и хранение мапы пользователей с их socketId
let ioInstance = null;

// userId -> Set из socketId (поддержка множественных сокетов на одного пользователя)
const userSockets = new Map();

//Устанавливает инстанс Socket.IO
export function setIo(io) {
  ioInstance = io;
}

//Возвращает текущий инстанс Socket.IO
export function getIo() {
  return ioInstance;
}

//Добавляет socketId пользователя в мапу
export function addUserSocket(userId, socketId) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
}

//Удаляет socketId пользователя из мапы, и если сокетов не осталось — удаляет пользователя
export function removeUserSocket(userId, socketId) {
  if (!userSockets.has(userId)) return;
  userSockets.get(userId).delete(socketId);
  if (userSockets.get(userId).size === 0) userSockets.delete(userId);
}

//Получить массив socketId по userId
export function getUserSocketIds(userId) {
  return userSockets.has(userId) ? Array.from(userSockets.get(userId)) : [];
}
