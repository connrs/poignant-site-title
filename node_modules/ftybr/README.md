# ftybr [![Build Status](https://secure.travis-ci.org/connrs/node-ftybr.png?branch=master)](http://travis-ci.org/connrs/node-ftybr)

I feel a pang of guilt. Because, as I refactored a little router out from another app, it slowly started to resemble Express/Connect.

At which point, I thought, "fuck it, I'll use it anyway."

So, my apologies for yet another router. I decided to call it follow the yellow brick road. Mostly because you'll melt if you use this router.

To create your router object:

    var router = require('ftybr')();

Once you've instantiated it, you may add middleware in the connect pattern:

    router.registerMiddleware(function (req, res, done) {
      // Middleware logic
    });

You'll also need to add some routes. To add routes, you'll need to register a controller. Controllers are objects, of some form, that must have a .getRoutes() method. This method returns a multi-dimensional array that is used to build the routes.

    router.registerController({
      getRoutes: function () [
        [ 'get', '/', function (req, res) { res.end('woo'); } ]
      ]
    });

Once you've done this, you can then use it as a requestListener within your http server:

    http.createServer(router.requestListener()).listen(8000);
