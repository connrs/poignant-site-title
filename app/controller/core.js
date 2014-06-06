var Template = require('../../lib/templates/');
var barnacleMode = require('barnacle-mode');
var formFilterStream = require('../../lib/streams/form-filter-stream/');
var templateStream = require('../../lib/streams/template-stream/');

function Controller() {
  this._actionStreams = {};
  this._formFilterStreams = {};
  this._templateStreams = {};
}

Controller.prototype.getRoutes = function () {
  return this._routes || [];
};

Controller.prototype._template = function (obj, layout) {
  var template = new Template(obj, layout);
  return template.generate.bind(template);
};

Controller.prototype._actionStream = function (name) {
  if (!this._isActionStreamGenerated(name)) {
    this._generateActionStream(name);
  }

  return this._actionStreams[name];
};

Controller.prototype._isActionStreamGenerated = function (name) {
  return typeof this._actionStreams[name] == 'function';
};

Controller.prototype._generateActionStream = function (name) {
  this._actionStreams[name] = barnacleMode(this[name].bind(this));
};

Controller.prototype._formFilterStream = function (name, defaults) {
  if (!this._isFormFilterStreamGenerated(name)) {
    this._generateFormFilterStream(name, defaults);
  }

  return this._formFilterStreams[name];
};

Controller.prototype._isFormFilterStreamGenerated = function (name) {
  return typeof this._formFilterStreams[name] == 'function';
};

Controller.prototype._generateFormFilterStream = function (name, defaults) {
  this._formFilterStreams[name] = formFilterStream(name, defaults);
};

Controller.prototype._templateStream = function (layout, viewTemplate) {
  if (!this._isTemplateStreamGenerated(layout + '/' + viewTemplate)) {
    this._generateTemplateStream(layout, viewTemplate);
  }

  return this._templateStreams[layout + '/' + viewTemplate];
};

Controller.prototype._isTemplateStreamGenerated = function (name) {
  return typeof this._templateStreams[name] == 'function';
};

Controller.prototype._generateTemplateStream = function (layout, viewTemplate) {
  this._templateStreams[layout + '/' + viewTemplate] = function () {
    return templateStream({
      layout: layout,
      viewTemplate: viewTemplate
    });
  };
};

module.exports = Controller;
