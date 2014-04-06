# IDPGoogle

I wanted to create a common interface to abstract multiple identity providers (using OAuth2 to start with) in order to provide authentication for my projects. This is the first.

    var idpGoogle = require('idp-google')({ clientID: '1234', clientSecret: 'secret', 'redirectUri': 'http://example.org' });

    // Get the auth URL to redirect the user for OAuth2 login
    idpGoogle.authUrl({ state: 'session_id' });

    // Using the code provided in the query string upon return to your web app, get the identity:
    idpGoogle(code, function (err, identity) {
      if (err) {
        console.error('explode');
      }
      else {
        do_amazing_things_with(identity.id, identity.name, identity.url, identity.accessToken);
      }
    });
