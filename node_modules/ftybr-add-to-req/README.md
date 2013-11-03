# ftybr-add-to-req [![Build Status](https://secure.travis-ci.org/connrs/node-ftybr-add-to-req.png?branch=master)](http://travis-ci.org/connrs/node-ftybr-add-to-req)

To create your middleware object:

    var addToReq = require('ftybr-add-to-req');

Once you've instantiated it, you may add this middleware to your ftybr router:

    router.registerMiddleware(addToReq('someData', ['win']));

This middleware will add the specified object to each request object
