var templateRoot = 'app/templates/handlebars';
var helpers = [
  require(templateRoot + '/helpers/date.js'),
  require(templateRoot + '/helpers/markdown.js'),
  require(templateRoot + '/helpers/each_keys.js'),
  require(templateRoot + '/helpers/blog.js'),
  require(templateRoot + '/helpers/general.js')
];

function initHandlebarsHelpers(handlebars) {
  return function (helpersFunc) {
    helpersFunc(handlebars);
  };
}

module.exports = function init (handlebars) {
  helpers.forEach(initHandlebarsHelpers(handlebars));
};
