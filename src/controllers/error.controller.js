import AppError from "../utils/AppError.js";

const sendErrorDev = function (err, req, res) {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = function (err, req, res) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);

    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

const handleDuplicateFieldDB = function (err) {
  const keys = Object.keys(err.keyValue);

  return new AppError(
    `${keys.join(",")} is already in use please choose a different one`,
    400
  );
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.log("ERROR: ", err);
  if (process.env.NODE_ENV === "development") {
    console.log("DEV ERROR: ", err);
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (error.code === 11000) error = handleDuplicateFieldDB(error);

    sendErrorProd(error, req, res);
  }
};
