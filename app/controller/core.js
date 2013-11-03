function Controller(boundMethods) {
  if (boundMethods) {
    this._bindToController(boundMethods);
  }
}

Controller.prototype.getRoutes = function () {
  return this._routes || [];
};

Controller.prototype.setView = function (view) {
  this._view = view;
};

Controller.prototype._bindToController = function (methods) {
  var i, length = methods.length, method;

  for (i = 0; i < length; i++) {
    method = this[methods[i]].bind(this);
    if (this.beforeAction) {
      this[methods[i]] = this.beforeAction.bind(this, method)
    }
    else {
      this[methods[i]] = method;
    }
  }
};

module.exports = Controller;
