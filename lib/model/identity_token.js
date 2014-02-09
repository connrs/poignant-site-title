var Model = require('./model');

function IdentityToken(store) {
  if (!(this instanceof IdentityToken)) {
    return new IdentityToken(store);
  }

  Model.apply(this, arguments);
  this._validationRules = [
  ];
  this._store = store;
}

IdentityToken.prototype = Object.create(Model.prototype, { constructor: IdentityToken });

IdentityToken.prototype.save = function (callback) {
  this._store.save(this._data, callback);
};

module.exports = IdentityToken;
