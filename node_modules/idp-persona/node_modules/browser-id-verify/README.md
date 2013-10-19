# Browser ID Verify [![Build Status](https://secure.travis-ci.org/connrs/node-browser-id-verify.png?branch=master)](http://travis-ci.org/connrs/node-browser-id-verify)

Verify BrowserID assertion

## Getting Started

Install the module with: `npm install browser-id-verify`

## Usage

    var verify = require('browser-id-verify');
    var opts = {
      assertion: 'somebrowseridassertion',
      audience: 'http://example.org',
      url: 'https://verifier.login.persona.org/verify'
    };
    verify(opts, function (err, response) {
      if (err) {
        //handle error
      }

      // handle response
    });
