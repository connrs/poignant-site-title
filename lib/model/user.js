var Model = require('./model');

function User(store) {
  if (!(this instanceof User)) {
    return new User(store);
  }

  Model.apply(this, arguments);
  this._validationRules = [
    { field: 'name', rule: 'NotEmpty', message: 'You must add a name' },
    { field: 'email', rule: 'NotEmpty', message: 'You must add an email address' },
    { field: 'provider_id', rule: 'NotEmpty', message: 'You don\'t appear to have signed in with a service' },
    { field: 'uid', rule: 'NotEmpty', message: 'You don\'t appear to have signed in with a service' },
    { field: 'by', rule: 'NotEmpty', message: 'You must be a logged in user to do this' },
  ];
  this._store = store;
}

User.prototype = Object.create(Model.prototype, { constructor: User });

User.prototype.save = function (callback) {
  this._store.save(this._data, callback);
};

User.prototype.find = function (filters, callback) {
  this._store.find(filters, callback);
};

User.prototype.findByProviderUid = function (providerUid, callback) {
  this._store.findByProviderUid(providerUid, callback);
};

User.prototype.findByIdentity = function (uid, provider_id, callback) {
  this._store.find({ uid: uid, provider_id: provider_id }, callback);
};

User.prototype.updateLastLogin = function (callback) {
  this._store.updateLastLogin(this._data, callback);
};

module.exports = User;
