import express from "express";
import {
  setAppointment,
  getAppointments,
  checkAvailability,
  updateAppointment,
  doctorUpdateAppointment,
} from "./../controllers/appointment.controller.js";

import { PERMISSION } from "../utils/constants.js";

import protect from "../middlewares/protect.js";
import permissionsRequired from "../middlewares/permissionsRequired.js";

const router = express.Router();

router.route("/").get(protect, getAppointments).post(setAppointment);
router.patch("/update/:id", protect, doctorUpdateAppointment);
router.route("/:id").patch(updateAppointment);

router.route("/availability").post(checkAvailability);

export default router;
