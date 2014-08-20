var marked = require('marked');

function init(handlebars) {
  handlebars.registerHelper('markdown', function (content) {
    content = marked(content);
    return new handlebars.SafeString(content);
  });

  handlebars.registerHelper('markdown_block', function (options) {
    var content = options.fn(this);
    return marked(content);
  });
}

module.exports = init;

