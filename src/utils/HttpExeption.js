// Сопоставление кодов ошибок с сообщениями по умолчанию
const messageList = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
};

//Создает объект ошибки с HTTP статусом и сообщением
const HttpExeption = (status, message = messageList[status]) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export default HttpExeption;