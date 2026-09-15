/* eslint-disable @typescript-eslint/no-require-imports */

const { createServer } = require("node:http");
const { parse } = require("node:url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT) || 3000;

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  global.io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinQueue", (queueId) => {
      socket.join(`queue:${queueId}`);

      console.log(
        `Socket ${socket.id} joined queue ${queueId}`
      );
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Qzen ready on http://${hostname}:${port}`
    );
  });
});