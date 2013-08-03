var xtend = require('xtend');
var libxml = require('libxmljs');
var moment = require('moment');
var string = require('string');

function RSSView() {}

RSSView.prototype.render = function (req, res) {
    var data = xtend({}, req.view.context);
    var xml = new libxml.Document();
    var content;

    if (req.providerUser) {
        data.current_user = req.providerUser.toData();
    }
    else {
        data.current_user = null;
    }

    data.config = req.config;
    data.csrf_token = req.session.uid();
    data.navigation = req.navigation;

    var root = xml.node('rss').attr('version', '2.0');
    var channel = root.node('channel');
    var i, item;
    channel.node('title', req.config.site_title.replace(/[<>]/g, ''));
    channel.node('link', req.config.base_address);
    channel.node('description', '');
    if (req.view.context.pubDate) {
      channel.node('pubDate', moment.unix(req.view.context.pubDate).format('ddd, DD MMM YYYY HH:mm:ss ZZ'))
    }

    for (i = 0; i < data.items.length; i++) {
      item = channel.node('item');
      item.node('title', data.items[i].title);
      item.node('link', data.items[i].link);
      item.node('guid', data.items[i].link);
      item.node('description', data.items[i].description);
      item.node('pubDate', moment(data.items[i].pubDate).format('ddd, DD MMM YYYY HH:mm:ss ZZ'));
    }

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    
    if (req.method !== 'HEAD') {
      res.write(xml.toString());
    }

    res.end();
};

function newRSSView() {
    var view = new RSSView();
    return view;
}

module.exports = newRSSView;
