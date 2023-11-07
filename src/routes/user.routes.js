import express from "express";
import {
  register,
  verifyEmail,
  login,
  changeEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
} from "./../controllers/auth.controller.js";

import { PERMISSION } from "../utils/constants.js";

import protect from "../middlewares/protect.js";
import permissionsRequired from "../middlewares/permissionsRequired.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/doctor/register", register);

router.post(
  "/auth/admin/register",
  protect,
  permissionsRequired(PERMISSION.CREATE_USER_KEY),
  register
);
router.get("/auth/refresh", refreshToken);

router.post("/auth/login", login);
router.patch("/auth/email", protect, changeEmail);
router.post("/auth/forgotPassword", forgotPassword);
router.post("/auth/resetPassword/:token", resetPassword);
router.get("/auth/emailverification/:token", verifyEmail);

router.get(
  "/",
  protect,
  permissionsRequired(PERMISSION.CREATE_USER_KEY),
  (req, res, next) => {
    res.status(200).json({
      message: "SUCCESS",
    });
  }
);

export default router;
