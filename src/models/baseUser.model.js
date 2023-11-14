import mongoose, { Schema } from "mongoose";
import isEmail from "validator/lib/isEmail.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import Email from "../utils/email.js";
import { TYPES, ROLES_TYPES } from "../utils/constants.js";

let userBaseSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      trim: true,
      unique: true,
      lowercase: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    role: {
      type: String,
      enum: [ROLES_TYPES.USER, ROLES_TYPES.DOCTOR, ROLES_TYPES.ADMIN],
      default: ROLES_TYPES.USER,
    },
    password: {
      type: String,
      required: [true, "Please provide your password"],
      minLength: 8,
      trim: true,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, "Please provide Confirm Password"],
      minLength: 8,
      trim: true,
      select: false,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not same",
      },
    },
    active: {
      type: Boolean,
      select: false,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpiration: Date,
    emailChangedAt: Date,
    emailVerificationToken: String,
    emailVerificationTokenExpiration: Date,
  },
  { timestamps: true, discriminatorKey: "_type" }
);

userBaseSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcryptjs.hash(this.password, 12);
    this.confirmPassword = undefined;
  }

  if (this.isModified("email")) {
    this.emailToken = this.createEmailVerificationToken();
  }

  this.wasNew = this.isNew;
  next();
});

userBaseSchema.pre("save", function (next) {
  if (this.isNew) return next();
  if (this.isModified("password")) {
    this.passwordChangedAt = Date.now() - 1000;
    this.isPasswordModified = true;
  }

  if (this.isModified("email")) {
    this.emailChangedAt = Date.now() - 1000;
    this.isEmailModified = true;
  }

  next();
});

userBaseSchema.post("save", async function (doc) {
  if (doc && (doc.isEmailModified || doc.wasNew)) {
    const email = new Email(
      doc,
      `${process.env.BASE_URL}/api/v1/users/auth/emailverification/${doc.emailToken}`
    );
    await email.sendWelcome();
  }
});

userBaseSchema.methods.comparePassword = async function (candidate, password) {
  return await bcryptjs.compare(candidate, password);
};

userBaseSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationTokenExpiration = Date.now() + 10 * 60 * 1000;

  return verificationToken;
};

userBaseSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.passwordResetTokenExpiration = Date.now() + 10 * 60 * 1000;

  return token;
};
userBaseSchema.methods.verifyVerificationToken = function (
  dbToken,
  paramToken,
  expiration
) {
  let isExpired = new Date(expiration).getTime() >= Date.now();
  if (isExpired) return isExpired;

  paramToken = crypto.createHash("sha256").update(paramToken).digest("hex");

  return dbToken === paramToken;
};
userBaseSchema.methods.isChangedAfter = function (iat, type) {
  if (type === TYPES.EMAIL && this.emailChangedAt) {
    return new Date(iat).getTime() < new Date(this.emailChangedAt).getTime();
  } else if (type === TYPES.PASSWORD && this.passwordChangedAt) {
    return new Date(iat).getTime() < new Date(this.passwordChangedAt).getTime();
  }
};

let baseUserModel = mongoose.model("User", userBaseSchema);

export { baseUserModel };
