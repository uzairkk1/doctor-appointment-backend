import catchAsync from "../utils/catchAsync.js";
import userModel from "../models/user.model.js";
import refreshTokenModel from "../models/refreshToken.model.js";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import isEmail from "validator/lib/isEmail.js";
import crypto from "crypto";
import Email from "../utils/email.js";
import { promisify } from "util";

export const register = catchAsync(async (req, res, next) => {
  let isAdmin = req.url.includes("/admin/");

  const newUser = new userModel({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  if (isAdmin) {
    newUser.role = req.body.role ? req.body.role : "USER";
  }

  await newUser.save();

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await userModel.findOne({ email }).select("+password");
  if (!user || !user.comparePassword(password, user.password))
    return next(new AppError("Invalid Credentials", 404));
  if (!user.isVerified)
    return next(
      new AppError("Please verify you account first before logging in", 400)
    );

  //generate tokens
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_KEY, {
    expiresIn: 60,
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

  const user = await userModel.findById(decoded.id);
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
    expiresIn: 3000,
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
    return next(new AppError("User doest not exist", 404));

  verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await userModel.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiration: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("User doest not exist", 404));

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
  const isNewEmailExist = await userModel.findOne({ email: newEmail });

  if (isNewEmailExist)
    return next(
      new AppError(
        "User with this email address already exist please choose a different one",
        401
      )
    );

  const user = await userModel.findById({ _id: req.user._id });

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

  const user = await userModel.findOne({ email });
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
    let url = `${process.env.BASE_URL}/api/v1/users/auth/resetPassword/${resetToken}`;
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

  const user = await userModel.findOne({
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
