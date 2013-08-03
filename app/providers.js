var newProvider = require('../lib/provider');

function initProviders(app, callback) {
    var getProviders = "SELECT provider_id, name, client_id, client_secret, auth_base_address, token_base_address, base_address, authorize_path, token_path, profile_path, profile_url_template FROM provider WHERE deleted IS NULL";
    var getAuthParameters = "SELECT key, value FROM provider_parameter WHERE provider_id = $1 AND provider_parameter_type_id = 1 AND deleted IS NULL";
    var getTokenParameters = "SELECT key, value FROM provider_parameter WHERE provider_id = $1 AND provider_parameter_type_id = 2 AND deleted IS NULL";

    app.providers = {};
    app.dbClient.query(getProviders, function (err, results) {
        if (err) {
            callback(err);
            return;
        }

        var authParamsCount = results.rows.length;
        var tokenParamsCount = results.rows.length;

        results.rows.forEach(function (providerData) {
            app.dbClient.query(getAuthParameters, [providerData.provider_id], function (err, results) {
                var authParameters = {};
                var tokenParameters = {};

                if (err) {
                    callback(err);
                    return;
                }

                results.rows.reduce(function (r, v) {
                    r[v.key] = v.value;
                    return r;
                }, authParameters);

                authParamsCount -= 1;
                app.dbClient.query(getTokenParameters, [providerData.provider_id], function (err, results) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    results.rows.reduce(function (r, v) {
                        r[v.key] = v.value;
                        return r;
                    }, tokenParameters);

                    app.providers[providerData.name.toLowerCase()] = newProvider(app.db.user, providerData, authParameters, tokenParameters);

                    tokenParamsCount -=1;

                    if (tokenParamsCount === 0 && authParamsCount === 0) {
                        callback();
                    }
                });
            });
        });
    });
}

module.exports = initProviders;
