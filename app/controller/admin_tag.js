var Controller = require('./core');
var Tag = require('../../lib/model/tag.js');
var HTTPError = require('http-errors');

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

AdminTagController.prototype.index = function (obj, done) {
  var filters;
  var tag = this._tag();
  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_tags_index'
  }

  obj.headers = {
    'cache-control': 'no-cache'
  };

  if (!obj.current_user || !obj.current_user.role_id) { return obj.redirect('/', 302); }

  context.filters = {};
  context.page = { title: 'Tags dashboard' };

  if (obj.data.clear !== undefined) {
    obj.session.set('admin_tags_index', {}, function (err) {
      tag.find({}, function (err, tags) {
        context.tags = tags;
        obj.output = template(context.current_navigation, context);
        done(null, obj);
      }.bind(this));
    }.bind(this));
  }
  else if (Object.keys(obj.data).length) {
    obj.session.set('admin_tags_index', obj.data, function (err) {
      context.filters.name = obj.data.name;
      tag.find(context.filters, function (err, tags) {
        context.tags = tags;
        obj.output = template(context.current_navigation, context);
        done(null, obj);
      }.bind(this));
    }.bind(this));
  }
  else {
    context.filters = obj.session.get('admin_tags_index') || {};
    tag.find(context.filters, function (err, tags) {
      context.tags = tags;
      obj.output = template(context.current_navigation, context);
      done(null, obj);
    }.bind(this));
  }
};

AdminTagController.prototype.edit = function (obj, done) {
  if (!obj.current_user || !obj.current_user.role_id) { return obj.redirect('/', 302); }

  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_tags_edit'
  }

  if (obj.data.tag) {
    context.tag = obj.data.tag;
    obj.output = template(context.current_navigation, context);
    return done(null, obj);
  }

  this._tag().find({ tag_id: obj.params.tag_id }, function (err, tag) {
    if (err) { return done(err); }

    context.tag = tag;
    context.page = { title: 'Edit tag - ' + tag.name };
    obj.output = template(context.current_navigation, context);
    done(null, obj);
  }.bind(this));
};

AdminTagController.prototype.editPost = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new HTTPError.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) { return done(new HTTPError.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

  var tag = this._tag();

  obj.data.by = obj.current_user.user_id;
  tag.setData(obj.data);

  tag.findById(obj.data.tag_id, function (err, tagData) {
    if (err) { return done(err); }

    if (!tagData) { return done(new HTTPError.BadRequestError()); }

    obj.data.name = tagData.name;
    tag.setData(obj.data);
    tag.hasChanged(function (err, changed) {
      if (err) { return done(err); }

      if (!changed) { return obj.redirect(obj.config.admin_base_address + '/tags', 302); }

      tag.validate(function (err, validationErrors) {
        if (err) { return done(err); }

        if (validationErrors !== false) {
          obj.data.tag = obj.data;
          obj.formErrors = validationErrors;
          this.edit(obj, done);
        }
        else {
          tag.save(function (err) {
            if (err) { return done(err); }

            obj.session.set('flash_message', 'Your tag has been updated.', function (err) {
              obj.redirect(obj.config.admin_base_address + '/tags', 302);
            });
          });
        }
      }.bind(this));
    }.bind(this))
  }.bind(this));
};

AdminTagController.prototype.delete = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new HTTPError.NotAuthorizedError()); }

  if (Object.keys(obj.data).length === 0) { return done(new HTTPError.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

  var template = this._template(obj, 'admin');
  var context = {
    'current_navigation': 'admin_tags_delete'
  };

  context.tag_ids = obj.data.tag_id;
  obj.output = template(context.current_navigation, context);
  done(null, obj);
};

AdminTagController.prototype.confirmDelete = function (obj, done) {
  if (!obj.hasPermission(['su', 'editor'])) { return done(new HTTPError.NotAuthorizedError()); }

  if (Object.prototype.toString.call(obj.data.tag_id) !== '[object Array]' || obj.data.tag_id.length === 0) { return done(new HTTPError.BadRequestError()); }

  if (obj.data.csrf_token !== obj.session.uid()) { return done(new HTTPError.BadRequestError()); }

  var tag = this._tag();

  tag.setData({
    tag_id: obj.data.tag_id,
    by: obj.current_user.user_id
  });
  tag.delete(function (err) {
    if (err) { return done(err); }

    obj.session.set('flash_message', 'The tags have been deleted.', function (err) {
      obj.redirect(obj.config.admin_base_address + '/tags', 302);
    });
  });
};

AdminTagController.prototype._tag = function () {
  return Tag(this._tagStore);
}

function newAdminTagController(tagStore) {
  var controller = new AdminTagController();
  controller.setTagStore(tagStore);
  return controller;
}

module.exports = newAdminTagController;
