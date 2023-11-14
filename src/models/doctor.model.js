import { Schema } from "mongoose";
import { baseUserModel } from "./baseUser.model.js";

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
    type: Array,
    trim: true,
  },
  isProfileCompleted: {
    type: Boolean,
    default: false,
  },
});

const Doctor = baseUserModel.discriminator("Doctor", DoctorSchema);

export default Doctor;
