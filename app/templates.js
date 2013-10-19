var precompileTemplates = require('../lib/templates');

function rebuildTemplates(app) {
  precompileTemplates(app.config.root_address + '/templates/templates', app.config.root_address + '/templates/partials', { encoding: 'UTF-8' }, function (err, templates) {
    if (err) {
      app.events.emit('templates_refreshed', err);
    }
    else {
      for (var t in templates) {
        if (templates.hasOwnProperty(t)) {
          app.templates[t] = templates[t];
        }
      }

      app.events.emit('templates_refreshed');
    }
  });
}

function initTemplates(app, callback) {
  app.templates = {};
  app.events.on('templates_refresh', rebuildTemplates.bind(null, app));
  app.events.once('templates_refreshed', callback);
  app.events.emit('templates_refresh');
}

module.exports = initTemplates
