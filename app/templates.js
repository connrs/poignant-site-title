var handlebars = require('handlebars');
var precompileTemplates = require('../lib/templates');

function buildProviderProfileTemplate(providers) {
  var p;
  var providerTemplates = [];

  for (p in providers) {
    if (providers.hasOwnProperty(p)) {
      providerTemplates.push({
        id: providers[p].providerId(),
        template: handlebars.compile(providers[p].profileUrlTemplate())
      });
    }
  }

  handlebars.registerHelper('profile_url', function (uid, provider_id) {
    var template = providerTemplates.filter(function (pt) { return pt.id == provider_id; })[0].template;
    return template({uid: uid});
  });
}

function rebuildTemplates(app) {
  precompileTemplates(app.config.root_address + '/templates/templates', app.config.root_address + '/templates/partials', { encoding: 'UTF-8' }, function (err, templates) {
    var t;

    if (err) {
      app.events.emit('templates_refreshed', err);
      return;
    }

    for (t in templates) {
      if (templates.hasOwnProperty(t)) {
        app.templates[t] = templates[t];
      }
    }

    buildProviderProfileTemplate(app.providers);
    app.events.emit('templates_refreshed');
  });
}

function initTemplates(app, callback) {
  app.templates = {};
  app.events.on('templates_refresh', rebuildTemplates.bind(null, app));
  app.events.once('templates_refreshed', callback);
  app.events.emit('templates_refresh');
}

module.exports = initTemplates
