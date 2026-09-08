import mongoose from "mongoose";
import { env } from "../config/env.service";

const DBConnection = () => {
  mongoose
    .connect(env.mongoURL)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.log(err);
    });
};

export default DBConnection;
