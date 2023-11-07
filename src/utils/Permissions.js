import { PERMISSION } from "./constants.js";
import Permission from "./permission.js";

class Permissions {
  constructor() {
    this.CREATE_USER = new Permission(
      PERMISSION.CREATE_USER_KEY,
      "Allow Creation of users"
    );
    this.READ_USER = new Permission(
      PERMISSION.READ_USER_KEY,
      "Allow displaying of users"
    );
    this.UPDATE_USER = new Permission(
      PERMISSION.UPDATE_USER_KEY,
      "Allow updating of users"
    );
    this.DELETE_USER = new Permission(
      PERMISSION.DELETE_USER_KEY,
      "Allow deletion of users"
    );
  }
}

export default new Permissions();
