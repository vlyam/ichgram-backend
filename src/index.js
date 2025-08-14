// Точка входа: подключение к БД и запуск серверов

import "dotenv/config";
import connectDatabase from "./db/connectDatabase.js";
import startServer from "./server.js";
// import startWebsocketServer from "./_wsServer.js";

const bootstrap = async () => {
  await connectDatabase();
  startServer();
  // startWebsocketServer();
};

bootstrap();