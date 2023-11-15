import express from "express";
import {
  setAppointment,
  getAppointments,
  checkAvailability,
} from "./../controllers/appointment.controller.js";

import { PERMISSION } from "../utils/constants.js";

import protect from "../middlewares/protect.js";
import permissionsRequired from "../middlewares/permissionsRequired.js";

const router = express.Router();

router.route("/").get(getAppointments).post(setAppointment);

router.route("/availability").post(checkAvailability);

export default router;
