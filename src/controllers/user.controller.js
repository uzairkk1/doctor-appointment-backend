import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import Doctor from "../models/doctor.model.js";
import { ROLES_TYPES } from "../utils/constants.js";

export const updateDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.params.id;
  const requesterId = req.user.id;
  if (doctorId != requesterId && req.user.role != ROLES_TYPES.ADMIN) {
    return next(
      new AppError("You don't have permission to perform this action", 403)
    );
  }

  const data = req.body;
  let doc = await Doctor.findOne({
    _id: doctorId,
  });

  if (!doc) {
    return res.status(404).json({
      status: "ok",
      message: "Requested doctor not found",
    });
  }

  doc.address = data.address;
  doc.specialization = data.specialization;
  doc.experience = data.experience;
  doc.feePerCunsultation = data.feePerCunsultation;
  doc.timings = data.timings;

  doc.isProfileCompleted =
    doc.address != undefined &&
    doc.specialization != undefined &&
    doc.experience != undefined &&
    doc.feePerCunsultation != undefined &&
    doc.timings.length
      ? true
      : false;

  await doc.save();

  res.status(200).json({
    status: "ok",
    data: doc,
  });
});

export const getDoctors = catchAsync(async (req, res, next) => {
  let doc = await Doctor.find({ isProfileCompleted: true });

  res.status(200).json({
    status: "ok",
    data: doc,
  });
});
export const getDoctor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let doc = await Doctor.findById(id).lean();

  const disabledDays = [1, 2, 3, 4, 5, 6, 7].filter((day) => {
    let isDocNotAvailable = false;
    doc.timings.forEach((time) => (isDocNotAvailable = time.dayIndex != day));

    return isDocNotAvailable;
  });

  doc.disabledDays = disabledDays;

  debugger;
  res.status(200).json({
    status: "ok",
    data: doc,
  });
});
