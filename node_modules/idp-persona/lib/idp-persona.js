var url = 'https://verifier.login.persona.org/verify';
var browserIDVerify = require('browser-id-verify');

function IDPPersona(options) {
  options = options || {};

  if (options.audience) {
    this._audience = options.audience;
  }
  else {
    throw new Error('IDPPersona no audience set');
  }
}

IDPPersona.prototype.identity = function (assertion, callback) {
  this._assertion = assertion;
  this._callback = callback;
  this._verifyAssertion();
};

IDPPersona.prototype._verifyAssertion = function () {
  browserIDVerify(this._verificationOptions(), this._onBrowserIDVerify.bind(this));
};

IDPPersona.prototype._verificationOptions = function () {
  return {
    assertion: this._assertion,
    audience: this._audience,
    url: url
  };
};

IDPPersona.prototype._onBrowserIDVerify = function (err, response) {
  if (err) {
    this._callback(err);
  }
  else {
    response.id = response.email;
    this._callback(null, response);
  }
};

function idpPersona(options) {
  var idp = new IDPPersona(options);
  return idp;
}

module.exports = idpPersona;
