var test = require('tape');
var templateStreamBuilder = require('app/builder/template-stream');
var Template = require('app/stream/template-stream').Template;

test('Instance of Template', function (t) {
  t.plan(1);
  t.ok(templateStreamBuilder('layout_name', 'template_name')() instanceof Template);
})
