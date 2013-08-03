function init(handlebars) {
  handlebars.registerHelper('eachkeys', function(context, options) {
    var fn = options.fn, inverse = options.inverse;
    var ret = "";
    var empty = true;
    var key;
    var newContext = {};
    var newKey;

    for (key in context) {
      if (context.hasOwnProperty(key)) {
        empty = false;
        break;
      }
    }

    if (!empty) {
      for (key in context) {
        if (context.hasOwnProperty(key)) {
          if (Object.prototype.toString.call(context[key]) === '[object Object]') {
            for (newKey in context[key]) {
              newContext[key + '.' + newKey] = context[key][newKey];
            }
          }
          else {
            newContext[key] = context[key];
          }
        }
      }
      context = newContext;

      for (key in context) {
        if (context.hasOwnProperty(key)) {
          ret = ret + fn({ 'key': key, 'value': context[key]});
        }
      }
    }
    else {
      ret = inverse(this);
    }

    return ret;
  });
}

module.exports = init;
