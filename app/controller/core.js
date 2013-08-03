function Controller(boundMethods) {
  if (boundMethods) {
    this._bindToController(boundMethods);
  }
}

Controller.prototype.setView = function (view) {
  this._view = view;
};

Controller.prototype._bindToController = function (methods) {
  var i, length = methods.length;
  for (i = 0; i < length; i++) {
    this[methods[i]] = this[methods[i]].bind(this);
  }
};

module.exports = Controller;
