var Model = require('./model');

function User() {
  Model.apply(this, arguments);
  this._validationRules = [
    { field: 'name', rule: 'NotEmpty', message: 'You must add a name' },
    { field: 'email', rule: 'NotEmpty', message: 'You must add an email address' },
    { field: 'provider_id', rule: 'NotEmpty', message: 'You don\'t appear to have signed in with a service' },
    { field: 'uid', rule: 'NotEmpty', message: 'You don\'t appear to have signed in with a service' },
    { field: 'by', rule: 'NotEmpty', message: 'You must be a logged in user to do this' },
  ];
}

User.prototype = Object.create(Model.prototype, { constructor: User });

User.prototype.setUserData = function (userData) {
  this._userData = userData;
};

User.prototype.save = function (callback) {
  this._userData.save(this._data, callback);
};

User.prototype.findByProviderUid = function (providerUid, callback) {
  this._userData.findByProviderUid(providerUid, callback);
};

User.prototype.updateLastLogin = function (callback) {
  this._userData.updateLastLogin(this._data, callback);
};

module.exports = User;
