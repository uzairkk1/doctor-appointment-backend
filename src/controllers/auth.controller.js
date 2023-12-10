import catchAsync from "../utils/catchAsync.js";
// import userModel from "../models/user.model.js";
import refreshTokenModel from "../models/refreshToken.model.js";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import isEmail from "validator/lib/isEmail.js";
import crypto from "crypto";
import Email from "../utils/email.js";
import { promisify } from "util";
import { ROLES_TYPES } from "../utils/constants.js";
import { baseUserModel } from "../models/baseUser.model.js";
import Doctor from "../models/doctor.model.js";

export const register = catchAsync(async (req, res, next) => {
  let isAdmin = req.url.includes("/admin/");
  let isDoctor = req.url.includes("/doctor/");

  let newUser = undefined;

  if (isAdmin || !isDoctor) {
    newUser = new baseUserModel({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });
    newUser.role = isAdmin && req.body.role ? req.body.role : ROLES_TYPES.USER;
  } else if (isDoctor) {
    newUser = new Doctor({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      role: ROLES_TYPES.DOCTOR,
    });
  }

  await newUser.save();

  res.status(200).json({
    status: "success",
    message:
      "Account was created successfully please check you email for verification",
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await baseUserModel.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password, user.password)))
    return next(new AppError("Invalid Credentials", 404));
  if (!user.isVerified)
    return next(
      new AppError("Please verify you account first before logging in", 400)
    );

  //generate tokens
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_KEY, {
    expiresIn: 20,
    issuer: "my-site.com",
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_KEY, {
    expiresIn: "7d",
    issuer: "my-site.com",
  });

  //save refresh token in db
  await refreshTokenModel.create({ refreshToken, userId: user._id });

  //send refresh token in cookies
  res.cookie("refreshToken", refreshToken, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    accessToken,
    user,
  });
});

export const getCurrentUser = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    user: req.user,
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: refreshTokenFromCookie } = req.cookies;
  if (!refreshTokenFromCookie)
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );

  //verify token
  const decoded = await promisify(jwt.verify)(
    refreshTokenFromCookie,
    process.env.JWT_REFRESH_KEY
  );

  const tokenFromDb = await refreshTokenModel.find({
    refreshToken: refreshTokenFromCookie,
    userId: decoded.id,
  });

  if (!tokenFromDb) {
    return next(new AppError("Invalid token", 401));
  }

  const user = await baseUserModel.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  //generate tokens
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_KEY, {
    expiresIn: 20,
    issuer: "my-site.com",
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_KEY, {
    expiresIn: "7d",
    issuer: "my-site.com",
  });

  await refreshTokenModel.updateOne({ userId: user._id }, { refreshToken });

  //send refresh token in cookies
  res.cookie("refreshToken", refreshToken, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    accessToken,
    user,
  });
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  let verificationToken = req.params.token;
  if (!verificationToken)
    return next(new AppError("Invalid token provided", 404));

  verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await baseUserModel.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiration: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Invalid token provided", 404));

  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiration = undefined;
  user.isVerified = true;

  await user.save();

  res.status(200).json({
    status: "Success",
    message: "Your email has been verified. You can now login and use the app",
  });
});
export const changeEmail = catchAsync(async (req, res, next) => {
  const { newEmail } = req.body;

  if (!isEmail(newEmail)) return next(new AppError("Invalid email", 401));
  const isNewEmailExist = await baseUserModel.findOne({ email: newEmail });

  if (isNewEmailExist)
    return next(
      new AppError(
        "User with this email address already exist please choose a different one",
        401
      )
    );

  const user = await baseUserModel.findById({ _id: req.user._id });

  user.email = newEmail;
  user.isVerified = false;

  await user.save();

  res.status(200).json({
    status: "Success",
    message:
      "Email has been successfully changed you will receive an email for confirming the shortly",
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!isEmail(email)) return next(new AppError("Invalid email", 401));

  const user = await baseUserModel.findOne({ email });
  if (!user) return next(new AppError("User doest not exist", 404));

  if (!user.isVerified)
    return next(
      new AppError(
        "Please verify your email first before resetting password",
        401
      )
    );

  let resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    let url = `${process.env.FRONT_END_BASE_URL}/verify/${resetToken}`;
    const email = new Email(user, url);
    await email.passwordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiration = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  let verificationToken = req.params.token;
  if (!verificationToken)
    return next(new AppError("User doest not exist", 404));

  verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await baseUserModel.findOne({
    passwordResetToken: verificationToken,
    passwordResetTokenExpiration: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("User doest not exist", 404));

  user.password = req.body.password;
  user.confirmPassword = req.body.password;

  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiration = undefined;

  await user.save();

  res.status(200).json({
    status: "Success",
    message:
      "Your password has been changed. You can now login and use the app",
  });
});

export const updateDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.params.id;
  const requesterId = req.user.id;
  if (doctorId != requesterId && req.user.role != ROLES_TYPES.ADMIN) {
    return res.status(403).json({
      status: "ok",
      message: "You don't have permission to perform this action",
    });
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

  await doc.save();

  res.status(200).json({
    status: "ok",
    data: "Your profile has been completed successfully",
  });
});
