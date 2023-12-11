import express from "express";
import {
  register,
  verifyEmail,
  login,
  changeEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  getCurrentUser,
} from "./../controllers/auth.controller.js";
import { updateDoctor, getDoctors } from "./../controllers/user.controller.js";

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
router.get("/auth/getCurrentUser", protect, getCurrentUser);
router.post("/auth/forgotPassword", forgotPassword);
router.post("/auth/resetPassword/:token", resetPassword);
router.get("/auth/emailverification/:token", verifyEmail);

router.post("/doctor/update/:id", protect, updateDoctor);

router.get("/doctors", protect, getDoctors);

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
