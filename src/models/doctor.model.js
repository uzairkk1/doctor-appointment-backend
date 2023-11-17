import { Schema } from "mongoose";
import { baseUserModel } from "./baseUser.model.js";

const slotsSchema = new Schema(
  {
    dayIndex: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3, 4, 5, 6],
      unique: true,
    },
    timingSlots: {
      type: [
        {
          startTime: String,
          endTime: String,
        },
      ],
      required: true,
    },
  },
  { _id: false }
);

const DoctorSchema = new Schema({
  address: {
    type: String,
    trim: true,
  },
  specialization: {
    type: String,
    trim: true,
  },
  experience: {
    type: String,
    trim: true,
  },
  feePerCunsultation: {
    type: Number,
    trim: true,
    default: 0,
  },
  timings: {
    type: [slotsSchema],
    required: true,
    default: [],
  },
  backTimings: {
    type: [
      {
        dayIndex: {
          type: Number,
          required: true,
        },
        timingSlots: {
          type: [String],
          required: true,
        },
        validTill: {
          type: Date,
          required: true,
        },
      },
    ],
    default: [],
  },
  isProfileCompleted: {
    type: Boolean,
    default: false,
  },
});

const Doctor = baseUserModel.discriminator("Doctor", DoctorSchema);

export default Doctor;
