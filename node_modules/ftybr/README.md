# ftybr [![Build Status](https://secure.travis-ci.org/connrs/node-ftybr.png?branch=master)](http://travis-ci.org/connrs/node-ftybr)

I feel a pang of guilt. Because, as I refactored a little router out from another app, it slowly started to resemble Express/Connect.

At which point, I thought, "fuck it, I'll use it anyway."

So, my apologies for yet another router. I decided to call it follow the yellow brick road. Mostly because you'll melt if you use this router.

To create your router object:

    var router = require('ftybr')();

You'll also need to add some routes. To add routes, you'll need to register a controller. Controllers are objects, of some form, that must have a .getRoutes() method. This method returns a multi-dimensional array that is used to build the routes.

    router.registerController({
      getRoutes: function () [
        [ 'get', '/', function (obj, done) { done(null, { output: 'WOO' }); } ]
      ]
    });

Once you've done this, you can then use it as a part of a stream within your requestListener function. See the barnacle-mode module on npm for an idea of how this would work. The idea is that you pipe in an object that contains req as a key and then it pipes onwards to a final stream that then pipes through to res.
