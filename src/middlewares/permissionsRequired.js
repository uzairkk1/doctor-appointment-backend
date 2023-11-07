import AppError from "../utils/AppError.js";
import Roles from "../utils/Roles.js";

export default (...permissions) => {
  return (req, res, next) => {
    let hasPermission = false;
    let allRoles = Roles.ALL_ROLES;
    let userRole = req.user.role;

    hasPermission = allRoles
      .find((role) => role.key === userRole)
      ?.permissions.some((per) => permissions.some((p) => per?.key == p));

    if (!hasPermission)
      return next(
        new AppError("You dont have permission to perform this action", 401)
      );

    next();
  };
};
