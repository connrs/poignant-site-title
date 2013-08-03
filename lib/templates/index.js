var readFileList = require('./read_file_list');
var handlebars = require('handlebars');
var initHelpers = require('./helpers');

function precompileTemplates(templatedirname, partialdirname, options, done) {
  var compileCount = 2;

  readFileList(templatedirname, function (err, files) {
    if (err) {
      done(err);
    }

    var templates = {}, i, key;

    for (i in files) {
      if (files.hasOwnProperty(i)) {
        key = i.replace(templatedirname + '/', '').replace('.hbs', '').replace(/[^A-Za-z0-9]+/g,'_');
        templates[key] = handlebars.compile(files[i].toString());
      }
    }

    compileCount -= 1;

    if (compileCount === 0) {
      done(null, templates);
    }
  });

  readFileList(partialdirname, function (err, files) {
    if (err) {
      done(err);
    }

    var templates = {}, i, key;

    for (i in files) {
      if (files.hasOwnProperty(i)) {
        key = i.replace(partialdirname + '/', '').replace('.hbs', '').replace(/[^A-Za-z0-9]+/g,'_');
        handlebars.registerPartial(key, files[i].toString());
      }
    }

    compileCount -= 1;

    if (compileCount === 0) {
      done(null, templates);
    }
  });
}

initHelpers(handlebars);
module.exports = precompileTemplates;
