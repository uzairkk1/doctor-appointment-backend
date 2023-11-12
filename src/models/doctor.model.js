import mongoose from "mongoose";
import isEmail from "validator/lib/isEmail.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import Email from "../utils/email.js";
import { TYPES } from "../utils/constants.js";
import { UserBaseSchema } from "./baseUser.model.js";

const DoctorSchema = new UserBaseSchema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
      default: undefined,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      default: undefined,
    },
    experience: {
      type: String,
      required: true,
      trim: true,
      default: undefined,
    },
    feePerCunsultation: {
      type: Number,
      required: true,
      trim: true,
      default: undefined,
    },
    timings: {
      type: Array,
      required: true,
      trim: true,
      default: undefined,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// DoctorSchema.pre("save")

const Doctor = mongoose.model("Doctor", DoctorSchema);

export default Doctor;
