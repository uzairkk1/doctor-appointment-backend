export default class Role {
  constructor(key, displayName, description, permissions) {
    this.key = key;
    this.displayName = displayName;
    this.description = description;
    this.permissions = permissions || [];
  }
}
