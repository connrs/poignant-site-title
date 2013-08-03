var initDateHelper = require('./date.js');
var initMarkdownHelper = require('./markdown.js');
var initEachKeysHelper = require('./each_keys.js');
var initBlogHelper = require('./blog.js');
var initGeneralHelpers = require('./general.js');

function initHelpers(handlebars) {
  initDateHelper(handlebars);
  initMarkdownHelper(handlebars);
  initEachKeysHelper(handlebars);
  initBlogHelper(handlebars);
  initGeneralHelpers(handlebars);
}

module.exports = initHelpers;
