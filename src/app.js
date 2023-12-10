import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import userRouter from "./routes/user.routes.js";
import appointmentRouter from "./routes/appointment.routes.js";
import errorController from "./controllers/error.controller.js";

import AppError from "./utils/AppError.js";

const app = express();

const corsOptions = {
  origin: process.env.FRONT_END_BASE_URL || "http://localhost:5173",
  credentials: true,
};

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/appointments", appointmentRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);

export default app;
