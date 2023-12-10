import Appointment from "../models/appointment.model.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import dayjs from "dayjs";

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
  let { userId, doctorId, date, time } = req.body;

  if (!userId || !doctorId || !date || !time) {
    return next(new AppError("All fields are required", 400));
  }

  let dateTime = dayjs(`${date} ${time}`);

  const apt = await Appointment.create({
    userId,
    doctorId,
    dateTime,
  });

  res.status(200).json({
    status: "success",
    data: apt,
  });
});

export const getAppointments = catchAsync(async (req, res, next) => {
  //simulate loggedin user for now
  const userId = req.user._id;

  const appointments = await Appointment.find({ userId })
    .populate("doctorId")
    .populate("userId");

  res.status(200).json({
    status: "success",
    data: appointments,
  });
});

export const doctorUpdateAppointment = catchAsync(async (req, res, next) => {
  //simulate loggedin user for now
  const aptId = req.params.id;
  const doctorId = req?.user?._id || "6553d73b6a79e14991998b9c";
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

  debugger;
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

  debugger;

  res.status(200).json({
    status: "success",
    data: appointment,
  });
});
