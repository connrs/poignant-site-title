# IDPFacebook

Facebook authentication.

    var idpFacebook = require('idp-facebook')({ clientID: '1234', clientSecret: 'secret', 'redirectUri': 'http://example.org' });

    // Get the auth URL to redirect the user for OAuth2 login
    idpFacebook.authUrl({ state: 'session_id' });

    // Using the code provided in the query string upon return to your web app, get the identity:
    idpFacebook(code, function (err, identity) {
      if (err) {
        console.error('explode');
      }
      else {
        do_amazing_things_with(identity.id, identity.name, identity.url, identity.accessToken);
      }
    });
