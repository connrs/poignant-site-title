var test = require('tape');
var streamCoupler = require('lib/util/stream-coupler');
var PassThrough = require('stream').PassThrough;

test('Pipe one stream together', function (t) {
  var streams = [
    new PassThrough()
  ];
  var plumbed = streamCoupler(streams);

  plumbed.on('data', function (data) {
    t.equal(data.toString(), 'TESTDATA');
  })
  plumbed.on('end', function () {
    t.end();
  })
  streams[0].end('TESTDATA');
});

test('Pipe two streams together', function (t) {
  var streams = [
    new PassThrough(),
    new PassThrough()
  ];
  var plumbed = streamCoupler(streams);

  plumbed.on('data', function (data) {
    t.equal(data.toString(), 'TESTDATA');
  })
  plumbed.on('end', function () {
    t.end();
  })
  streams[0].end('TESTDATA');
});
