function init(handlebars) {
  handlebars.registerHelper('eq', function(val, val2, options) {
    if (val != val2) {
      return options.inverse(this);
    }
    else {
      return options.fn(this);
    }
  });

  handlebars.registerHelper('in', function () {
    var data = [].slice.call(arguments);
    var options = data.pop();
    var value = data.shift();

    if (data.indexOf(value) !== -1) {
      return options.fn(this);
    }
    else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper('stringify', function (data) {
    return new handlebars.SafeString(JSON.stringify(data));
  });

  handlebars.registerHelper('currentString', function (currentNavigation, compare) {
    if (currentNavigation === compare) {
      return new handlebars.SafeString(" class=\"current\"");
    }
  });

  handlebars.registerHelper('leftMatch', function (val1, val2, options) {
    if (val1.match(new RegExp('^' + val2 + '.*'))) {
      return options.fn(this);
    }
    else {
      return options.inverse(this);
    }
  });

  handlebars.registerHelper('attrSafe', function (val) {
    if (val == null) {
      return '';
    }

    return encodeURI(val);
  });
}

module.exports = init;
