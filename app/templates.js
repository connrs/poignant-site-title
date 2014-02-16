var handlebars = require('handlebars');
var stph = require('stream-to-precompiled-hbs');
var sthp = require('stream-to-hbs-partial');
var helpers = [
  require('../lib/helper/handlebars/date.js'),
  require('../lib/helper/handlebars/markdown.js'),
  require('../lib/helper/handlebars/each_keys.js'),
  require('../lib/helper/handlebars/blog.js'),
  require('../lib/helper/handlebars/general.js')
];

function rebuild(app) {
  var templates;
  var count = 2;
  var done = function () {
    if (--count === 0) {
      app.events.emit('~templates_refreshed');
    }
  };
  var addToTemplates = function (data) {
    app.templates[data[0]] = data[1];
  };

  sthp(handlebars, app.config.root_address + '/templates/partials', done);
  templates = stph(handlebars, app.config.root_address + '/templates/templates');
  templates.on('data', addToTemplates);
  templates.on('end', done);
}

function initHelpers(app) {
  helpers.forEach(function (helper) {
    helper(handlebars);
  });
}

function init(app, callback) {
  initHelpers(app);
  app.templates = {};
  app.events.on('templates_refresh', rebuild.bind(null, app));
  app.events.once('~templates_refreshed', callback);
  rebuild(app);
}

module.exports = init;
