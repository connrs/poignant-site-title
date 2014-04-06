var xtend = require('xtend');
var libxml = require('libxmljs');
var moment = require('moment');
var string = require('string');

function RSSView() {}

RSSView.prototype.render = function (obj, data) {
    var xml = new libxml.Document();
    var content;

    data.config = obj.config;

    var root = xml.node('rss').attr('version', '2.0');
    var channel = root.node('channel');
    var i, item;
    channel.node('title', obj.config.site_title.replace(/[<>]/g, ''));
    channel.node('link', obj.config.base_address);
    channel.node('description', '');

    if (data.pubDate) {
      channel.node('pubDate', moment.unix(data.pubDate).format('ddd, DD MMM YYYY HH:mm:ss ZZ'))
    }

    for (i = 0; i < data.items.length; i++) {
      item = channel.node('item');
      item.node('title', data.items[i].title);
      item.node('link', data.items[i].link);
      item.node('guid', data.items[i].link);
      item.node('description', data.items[i].description);
      item.node('pubDate', moment(data.items[i].pubDate).format('ddd, DD MMM YYYY HH:mm:ss ZZ'));
    }

    return xml.toString();
};

module.exports = RSSView;
