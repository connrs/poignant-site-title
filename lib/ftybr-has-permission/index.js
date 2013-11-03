function hasPermission(role_names) {
  if (!this.current_user) {
    return false;
  }

  if (role_names === undefined) {
    return 'current_user' in this;
  }

  if (!Array.isArray(role_names)) {
    role_names = [ role_names ];
  }

  return role_names.indexOf(this.current_user.role_name) !== -1;
}

module.exports = function (req, res, done) {
  req.hasPermission = hasPermission;
  done();
};
