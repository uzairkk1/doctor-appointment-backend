import Appointment from "../models/appointment.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

export const setAppointment = catchAsync(async (req, res, next) => {
  let { userId, doctorId, date, time } = req.body;

  if (!userId || !doctorId || !date || !time) {
    return next(new AppError("All fields are required", 400));
  }

  const apt = await Appointment.create({
    userId,
    doctorId,
    date,
    time,
  });

  res.status(200).json({
    status: "success",
    data: apt,
  });
});

export const getAppointments = catchAsync(async (req, res, next) => {
  //simulate loggedin user for now
  const userId = "6553d303c9ad6c4be3738d16";

  const appointments = await Appointment.find({ userId }).populate("doctorId");

  res.status(200).json({
    status: "success",
    data: appointments,
  });
});
