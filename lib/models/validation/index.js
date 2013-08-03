function ValidateModel() {
  this._validateCallback = undefined;
  this._errors = {};
  this._errorCount = 0;
  this._count = 0;
}

ValidateModel.prototype.setData = function (data) {
  this._data = data;
};

ValidateModel.prototype.setRules = function (rules) {
  this._rules = rules;
  this._rulesLength = rules.length;
};

ValidateModel.prototype.setModel = function (model) {
  this._model = model;
};

ValidateModel.prototype.validate = function (callback) {
  this._setValidationCallback(callback);
  this._validateRules();
};

ValidateModel.prototype._setValidationCallback = function (callback) {
  this._validationCallback = callback;
};

ValidateModel.prototype._validateRules = function () {
  var i;

  for (i = 0; i < this._rulesLength; i++) {
    this._validateRule(i);
  }
};

ValidateModel.prototype._validateRule = function (i) {
  var method = this._validationMethod(i);
  var data = this._data[this._rules[i].field];

  method(data, this._processFieldValidation.bind(this, i));

};

ValidateModel.prototype._validationMethod = function (i) {
  return this._model['_validate' + this._rules[i].rule].bind(this._model);
};

ValidateModel.prototype._processFieldValidation = function (i, err, result) {
  this._count++;

  if (err) {
    this._validationCallback(err);
  }
  else {
    this._processFieldResult(i, result);
  }
};

ValidateModel.prototype._processFieldResult = function (i, result) {
  if (!result) {
    this._appendError(i);
  }

  if (this._validationComplete()) {
    this._processValidationCallback();
  }
};

ValidateModel.prototype._appendError = function (i) {
  this._errorCount++;
  this._appendMessageToErrorField(this._rules[i].field, this._rules[i].message);
};

ValidateModel.prototype._appendMessageToErrorField = function (field, message) {
  if (!this._errors[field]) {
    this._errors[field] = [];
  }

  this._errors[field].push(message);
};

ValidateModel.prototype._validationComplete = function () {
  return this._count === this._rulesLength;
};

ValidateModel.prototype._processValidationCallback = function () {
  if (this._encounteredErrors()) {
    this._validationCallback(null, this._errors);
  }
  else {
    this._validationCallback(null, false);
  }
};

ValidateModel.prototype._encounteredErrors = function () {
  return this._errorCount > 0;
};

module.exports = ValidateModel;
