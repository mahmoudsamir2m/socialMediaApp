import express from "express";
import type { Express } from "express";
import { createServer } from "node:http";
import {
  authRouter,
  chatRouter,
  commentRouter,
  friendRouter,
  postRouter,
  userRouter,
} from "./modules";
import cors from "cors";
import { globalErrorHandler } from "./middleware/error.middleware";
import { env } from "./config/env.service";
import DBConnection from "./database/connections";
import { redisService } from "./common/services/redis.service";
import { initializeSocket } from "./socket/socket.service";

export const bootstrap = async () => {
  const app: Express = express();
  app.use(cors(), express.json());
  await DBConnection();
  redisService.connect();
  app.use("/auth", authRouter);
  app.use("/users", userRouter);
  app.use("/posts", postRouter);
  app.use("/comments", commentRouter);
  app.use("/friends", friendRouter);
  app.use("/conversations", chatRouter);
  app.use(globalErrorHandler);
  const server = createServer(app);
  initializeSocket(server);
  server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};
