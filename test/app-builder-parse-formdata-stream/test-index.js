var test = require('tape');
var parseFormDataStreamBuilder = require('app/builder/parse-form-data-stream');
var ParseFormData = require('barnacle-parse-formdata');

test('Instance of ParseFormData', function (t) {
  t.plan(1);
  t.ok(parseFormDataStreamBuilder()() instanceof ParseFormData);
})
