var time = require('time')(Date);
var moment = require('moment');

function init(handlebars) {
  handlebars.registerHelper('date_format', function (date, format) {
    var date = new Date(date);
    date.setTimezone('Europe/London');
    return moment(date).format(format);
  });
}

module.exports = init;
