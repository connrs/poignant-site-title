# IDPPersona [![Build Status](https://secure.travis-ci.org/connrs/node-idp-persona.png?branch=master)](http://travis-ci.org/connrs/node-idp-persona)

Persona client

## Getting Started

Install the module with: `npm install idp-persona`

## Usage

    var idpPersona = require('idp-github')({ audience: 'http://myurl' });

    // Using the assertion provided by the Persona login, get the identity:
    idpPersona(assertion, function (err, identity) {
      if (err) {
        console.error('explode');
      }
      else {
        do_amazing_things_with(identity.id, identity.email);
        // identity.id and identity.email are the same thing
      }
    });
