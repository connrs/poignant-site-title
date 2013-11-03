var ValidateModel = require('./validation');

function Model() {
  this._validationErrors = {};
  this._validationErrorCount = 0;
  this._validationCount = 0;
  this._validationRulesLength = 0;
  this._validationCallback = undefined;
}

Model.prototype.setData = function (data) {
  this._data = data;
};

Model.prototype.validate = function (callback) {
  var validate = new ValidateModel();
  validate.setModel(this);
  validate.setData(this._data);
  validate.setRules(this._validationRules);
  validate.validate(callback);
};

Model.prototype._validateNotEmpty = function (fieldData, callback) {
  callback(null, fieldData !== '');
};

module.exports = Model;
