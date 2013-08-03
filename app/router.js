var router = require('../lib/router');

function initRouter(app, callback) {
    app.router = router(app.config, app.navigation, app.sessionHandler, app.db.user);
    callback();
}

module.exports = initRouter;
