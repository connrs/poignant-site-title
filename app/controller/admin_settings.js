var Controller = require('./core');
var boundMethods = [
  'index','reloadPost','reload','general','generalPost'
];

function filtersNotEmpty(filters) {
  var f;

  for (f in filters) {
    if (filters.hasOwnProperty(f) && filters[f] !== '' && filters[f] !== null && filters[f] !== undefined) {
      return true;
    }
  }

  return false;
}

function AdminSettingsController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['get', '/admin/settings', this.index.bind(this)],
    ['head', '/admin/settings', this.index.bind(this)],
    ['get', '/admin/settings/reload',this.reload.bind(this)],
    ['head', '/admin/settings/reload', this.reload.bind(this)],
    ['post', '/admin/settings/reload', this.reloadPost.bind(this)],
    ['get', '/admin/settings/general', this.general.bind(this)],
    ['head', '/admin/settings/general', this.general.bind(this)],
    ['post', '/admin/settings/general', this.generalPost.bind(this)]
  ];
}

AdminSettingsController.prototype = Object.create(Controller.prototype, { constructor: AdminSettingsController });

AdminSettingsController.prototype.setEvents = function (events) {
  this._events = events;
};

AdminSettingsController.prototype.setConfig = function (config) {
  this._config = config;
};

AdminSettingsController.prototype.beforeAction = function (callback, req, res) {
  req.view.layout = 'admin';
  callback(req, res);
};

AdminSettingsController.prototype.index = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  req.view.template = 'admin_settings_index';
  req.view.context.page = { title: 'Settings dashboard' };
  this._view.render(req, res);
};

AdminSettingsController.prototype.general = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  if (req.view.context.standing_data) {
    this._view.render(req, res);
    return;
  }

  req.view.context.standing_data = {
    'site_title': this._config.site_title,
    'base_address': this._config.base_address,
    'root_address': this._config.root_address,
    'admin_base_address': this._config.admin_base_address,
    'assets_base_address': this._config.assets_base_address,
    'assets_root_address': this._config.assets_root_address
  };

  req.view.template = 'admin_settings_general';
  req.view.context.page = { title: 'Standing data - Settings dashboard' };
  this._view.render(req, res);
};

AdminSettingsController.prototype.generalPost = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

};

AdminSettingsController.prototype.reload = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  req.view.template = 'admin_settings_reload';
  req.view.context.page = { title: 'Reload - Settings dashboard' };
  this._view.render(req, res);
};

AdminSettingsController.prototype.reloadPost = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  if (req.data.action == 'templates') {
    this._events.emit('templates_refresh');
    req.session.set('flash_message', 'The templates were refreshed.', function () {
      res.redirect(req.config.admin_base_address + '/settings/reload', 302);
    });
  }
  else if (req.data.action == 'config') {
    this._events.emit('config_refresh');
    req.session.set('flash_message', 'The website configuration was refreshed', function () {
      res.redirect(req.config.admin_base_address + '/settings/reload', 302);
    });
  }
  else {
    req.session.set('flash_message', 'Action not found', function () {
      res.redirect(req.config.admin_base_address + '/settings', 302);
    });
  }
};

function newAdminSettingsController(view, events, config) {
  var controller = new AdminSettingsController(boundMethods);
  controller.setView(view);
  controller.setEvents(events);
  controller.setConfig(config);
  return controller;
}

module.exports = newAdminSettingsController;
