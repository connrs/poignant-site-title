var Template = require('../templates.js');

function Controller() {}

Controller.prototype.getRoutes = function () {
  return this._routes || [];
};

Controller.prototype._template = function (obj, layout) {
  var template = new Template(obj, layout);
  return template.generate.bind(template);
};

module.exports = Controller;
