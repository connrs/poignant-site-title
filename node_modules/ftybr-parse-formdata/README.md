# ftybr-parse-formdata [![Build Status](https://secure.travis-ci.org/connrs/node-ftybr-parse-formdata.png?branch=master)](http://travis-ci.org/connrs/node-ftybr-parse-formdata)

To create your middleware object:

    var parseFormdata = require('ftybr-parse-formdata')();

Once you've instantiated it, you may add this middleware to your ftybr router:

    router.registerMiddleware(parseFormdata());

This middleware will create a req.data object containing the parsed data from any GET query string, POST form data and or POST JSON data. The POST data will overwrite any GET data.
