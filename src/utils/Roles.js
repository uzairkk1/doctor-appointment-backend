import Role from "./Role.js";
import Permissions from "./permissions.js";

class Roles {
  constructor() {
    this.ADMIN = new Role("ADMIN", "Admin", "Admin can manage everything", [
      Permissions.CREATE_USER,
      Permissions.READ_USER,
      Permissions.UPDATE_USER,
      Permissions.DELETE_USER,
    ]);
    this.SUB_ADMIN = new Role(
      "SUB_ADMIN",
      "Sub Admin",
      "Sub Admin can manage some part of Application",
      [Permissions.READ_USER]
    );
    this.ALL_ROLES = [this.ADMIN, this.SUB_ADMIN];
  }
}

export default new Roles();
