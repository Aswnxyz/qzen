import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT) || 3000;

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer);

  globalThis.io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinQueue", (queueId) => {
      socket.join(`queue:${queueId}`);

      console.log(`Socket ${socket.id} joined queue ${queueId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Qzen ready on http://${hostname}:${port}`);
  });
});
