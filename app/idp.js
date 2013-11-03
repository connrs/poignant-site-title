var idp = {
  google: require('idp-google'),
  github: require('idp-github'),
  facebook: require('idp-facebook'),
  persona: require('idp-persona')
};

function init(app, callback) {
  var getProviders = "SELECT provider_id, name, client_id, client_secret, redirect_uri FROM provider WHERE deleted IS NULL";

  app.idp = {};
  app.storeClient.client(function (err, query) {
    if (err) {
      callback(err);
    }
    else {
      query(getProviders, [], function (err, results) {
        if (err) {
          callback(err);
        }
        else {
          results.rows.forEach(function (providerData) {
            var settings = {};

            if (providerData.name.toLowerCase() === 'persona') {
              settings.audience = app.config.base_address;
            }
            else {
              settings.clientId = providerData.client_id;
              settings.clientSecret = providerData.client_secret;
              settings.redirectUri = providerData.redirect_uri;
            }

            app.idp[providerData.name.toLowerCase()] = idp[providerData.name.toLowerCase()].bind(idp[providerData.name], settings);
          });
          callback();
        }
      });
    }
  });
}

module.exports = init;
