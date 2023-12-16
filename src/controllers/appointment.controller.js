import Appointment from "../models/appointment.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import dayjs from "dayjs";
import { ROLES_TYPES } from "../utils/constants.js";

export const checkAvailability = catchAsync(async (req, res, next) => {
  const date = dayjs(`${req.body.date} ${req.body.time}`);
  const fromTime = date.subtract(30, "m");
  const toTime = date.add(30, "m");

  const appointments = await Appointment.find({
    doctorId: req.body.doctorId,
    dateTime: { $gte: fromTime.toISOString(), $lte: toTime.toISOString() },
  });

  if (appointments.length > 0) {
    return res.status(200).send({
      message: "Appointments not available",
      success: false,
    });
  }

  return res.status(200).send({
    message: "Appointments available",
    success: true,
  });
});

export const setAppointment = catchAsync(async (req, res, next) => {
  let { userId, doctorId, date, timeSlot } = req.body;

  if (!userId || !doctorId || !date || !timeSlot) {
    return next(new AppError("All fields are required", 400));
  }

  const apt = await Appointment.create({
    userId,
    doctorId,
    date,
    timeSlot,
  });

  res.status(200).json({
    status: "success",
    data: apt,
  });
});

export const getAppointments = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { docId, date } = req.query;
  let filter = { userId };
  if (req.user.role === ROLES_TYPES.DOCTOR) {
    filter = { doctorId: userId };
  }

  if (docId && date) {
    filter = { doctorId: docId, date, status: { $ne: "REJECTED" } };
  }

  const appointments = await Appointment.find(filter)
    .populate("doctorId")
    .populate("userId")
    .lean();

  res.status(200).json({
    status: "success",
    data: appointments,
  });
});

export const doctorUpdateAppointment = catchAsync(async (req, res, next) => {
  //simulate loggedin user for now
  const aptId = req.params.id;
  const doctorId = req?.user?._id;
  const { status } = req.body;
  if (!aptId) return next(new AppError("Invalid appointment id", 400));

  if (!status) return next(new AppError("Invalid status", 400));

  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: aptId,
      doctorId,
    },
    { status },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: appointment,
  });
});
export const updateAppointment = catchAsync(async (req, res, next) => {
  //simulate loggedin user for now
  const aptId = req.params.id;
  const userId = req?.user?._id || "6553d303c9ad6c4be3738d16";
  const { date, time } = req.body;

  if (!aptId) return next(new AppError("Invalid appointment id", 400));

  if (!date || !time) return next(new AppError("Invalid date or time", 400));

  let dateTime = dayjs(`${date} ${time}`);

  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: aptId,
      userId,
      status: { $eq: "PENDING" },
    },
    { dateTime },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: appointment,
  });
});
