var Controller = require('./core');
var Tag = require('../../lib/model/tag.js');
var boundMethods = [
  'index', 'edit', 'editPost', 'new', 'newPost', 'delete', 'confirmDelete'
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

function AdminTagController() {
  Controller.apply(this, arguments);
  this._routes = [
    ['all', '/admin/tags', this.index.bind(this)],
    ['head', '/admin/tags', this.index.bind(this)],
    ['get', '/admin/tags/new', this.new.bind(this)],
    ['head', '/admin/tags/new', this.new.bind(this)],
    ['post', '/admin/tags/new', this.newPost.bind(this)],
    ['get', '/admin/tags/edit/:tag_id', this.edit.bind(this)],
    ['head', '/admin/tags/edit/:tag_id', this.edit.bind(this)],
    ['post', '/admin/tags/edit/:tag_id', this.editPost.bind(this)],
    ['post', '/admin/tags/delete', this.delete.bind(this)],
    ['post', '/admin/tags/confirm_delete', this.confirmDelete.bind(this)]
  ];
}

AdminTagController.prototype = Object.create(Controller.prototype, { constructor: AdminTagController });

AdminTagController.prototype.setTagStore = function (tagStore) {
  this._tagStore = tagStore;
};

AdminTagController.prototype.beforeAction = function (callback, req, res) {
  req.view.layout = 'admin';
  callback(req, res);
};

AdminTagController.prototype.index = function (req, res) {
  var filters;
  var tag = this._tag();

  res.setHeader('Cache-Control', 'no-cache');
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  req.view.template = 'admin_tags_index';
  req.view.context.filters = {};
  req.view.context.page = { title: 'Tags dashboard' };

  if (req.data.clear !== undefined) {
    req.session.set('admin_tags_index', {}, function (err) {
      tag.find({}, function (err, tags) {
        req.view.context.tags = tags;
        this._view.render(req, res);
      }.bind(this));
    }.bind(this));
  }
  else if (Object.keys(req.data).length) {
    req.session.set('admin_tags_index', req.data, function (err) {
      req.view.context.filters.name = req.data.name;
      tag.find(req.view.context.filters, function (err, tags) {
        req.view.context.tags = tags;
        this._view.render(req, res);
      }.bind(this));
    }.bind(this));
  }
  else {
    req.view.context.filters = req.session.get('admin_tags_index') || {};
    tag.find(req.view.context.filters, function (err, tags) {
      req.view.context.tags = tags;
      this._view.render(req, res);
    }.bind(this));
  }
};

AdminTagController.prototype.edit = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  req.view.template = 'admin_tags_edit';

  if (req.view.context.tag) {
    this._view.render(req, res);
    return;
  }

  this._tag().find({ tag_id: req.params.tag_id }, function (err, tag) {
    if (err) {
      res.render500(err);
    }
    else {
      req.view.context.tag = tag;
      req.view.context.page = { title: 'Edit tag - ' + tag.name };
      this._view.render(req, res);
    }
  }.bind(this));
};

AdminTagController.prototype.editPost = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  if (Object.keys(req.data).length === 0) {
    res.redirect(req.config.admin_base_address + '/tags/edit' + req.params.tag_id, 302);
    return;
  }

  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  var tag = this._tag();
  req.data.by = req.current_user.user_id;
  tag.setData(req.data);

  tag.findById(req.data.tag_id, function (err, tagData) {
    if (err) {
      res.render500(err);
      return;
    }

    req.data.name = tagData.name;
    tag.setData(req.data);
    tag.hasChanged(function (err, changed) {
      if (err) {
        res.render500(err);
      }
      else if (!changed) {
        res.redirect(req.config.admin_base_address + '/tags', 302);
      }
      else {
        tag.validate(function (err, validationErrors) {
          if (err) {
            res.render500(err);
          }
          else if (validationErrors !== false) {
            req.view.context.tag = req.data;
            req.view.context.errors = validationErrors;
            this.edit(req, res);
          }
          else {
            tag.save(function (err) {
              if (err) {
                res.render500(err);
              }
              else {
                req.session.set('flash_message', 'Your tag has been updated.', function (err) {
                  res.redirect(req.config.admin_base_address + '/tags', 302);
                });
              }
            });
          }
        }.bind(this));
      }
    }.bind(this))
  }.bind(this));
};

AdminTagController.prototype.new = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  req.view.template = 'admin_tags_new';
  req.view.context.page = { title: 'New tag' };
  this._view.render(req, res);
};

AdminTagController.prototype.newPost = function (req, res) {
  var tag;

  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
  }
  else if (Object.keys(req.data).length === 0) {
    req.view.errors = { general: 'No data submitted' };
    this.new(req, res);
  }
  else if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }
  else {
    req.data.by = req.current_user.user_id;
    tag = this._tag();
    tag.setData(req.data);
    tag.validate(function (err, validationErrors) {
      if (err) {
        res.render500(err);
      }
      else if (validationErrors !== false) {
        req.view.context.tag = req.data;
        req.view.context.errors = validationErrors;
        this.new(req, res);
      }
      else {
        tag.save(function (err, tag_id) {
          if (err) {
            res.render500(err);
          }
          else {
            req.session.set('flash_message', 'Your tag has been saved.', function (err) {
              res.redirect(req.config.admin_base_address + '/tags', 302);
            });
          }
        });
      }
    }.bind(this));
  }
};

AdminTagController.prototype.delete = function (req, res) {
  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
    return;
  }

  if (Object.keys(req.data).length === 0) {
    res.redirect(req.config.admin_base_address + '/tags');
    return;
  }

  if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }

  req.view.template = 'admin_tags_delete';
  req.view.context.tag_ids = req.data.tag_id;
  this._view.render(req, res);
};

AdminTagController.prototype.confirmDelete = function (req, res) {
  var tag;

  if (!req.current_user || !req.current_user.role_id) {
    res.redirect('/', 302);
  }
  else if (Object.prototype.toString.call(req.data.tag_id) !== '[object Array]' || req.data.tag_id.length === 0) {
    res.redirect(req.config.admin_base_address + '/tags', 302);
  }
  else if (req.data.csrf_token !== req.session.uid()) {
    res.render400();
    return;
  }
  else {
    tag = this._tag();
    tag.setData({
      tag_id: req.data.tag_id,
      by: req.current_user.user_id
    });
    tag.delete(function (err) {
      if (err) {
        res.render500(err);
      }
      else {
        req.session.set('flash_message', 'The tags have been deleted.', function (err) {
          res.redirect(req.config.admin_base_address + '/tags', 302);
        });
      }
    });
  }
};

AdminTagController.prototype._tag = function () {
  return Tag(this._tagStore);
}

function newAdminTagController(view, tagStore) {
  var controller = new AdminTagController(boundMethods);
  controller.setView(view);
  controller.setTagStore(tagStore);
  return controller;
}

module.exports = newAdminTagController;
