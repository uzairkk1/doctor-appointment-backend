import { promisify } from "util";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { TYPES } from "./../utils/constants.js";
import catchAsync from "./../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export default catchAsync(async (req, res, next) => {
  //get the user access token
  let token;
  console.log(req.headers.authorization);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_ACCESS_KEY
  );

  // 3) Check if user still exists
  const currentUser = await userModel.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  //4) check if email is changed after the token is generated;

  const isEmailChanged = currentUser.isChangedAfter(decoded.iat, TYPES.EMAIL);
  if (isEmailChanged) {
    return next(
      new AppError("User recently changed email! Please log in again.", 401)
    );
  }

  const isPasswordChaged = currentUser.isChangedAfter(
    decoded.iat,
    TYPES.PASSWORD
  );
  if (isPasswordChaged) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
