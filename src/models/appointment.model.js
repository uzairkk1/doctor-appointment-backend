import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: {
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
      },
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "CANCELLED", "COMPLETED"],
      required: true,
      default: "PENDING",
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
