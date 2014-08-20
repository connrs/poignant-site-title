var test = require('tape');
var authoriseUserStreamBuilder = require('app/builder/authorise-user-stream');
var AuthoriseUser = require('lib/stream/authorise-user').AuthoriseUser;
var AuthoriseUserByRole = require('lib/stream/authorise-user-by-role').AuthoriseUserByRole;

test('Instance of AuthoriseUserStream', function (t) {
  t.plan(1);
  t.ok(authoriseUserStreamBuilder()() instanceof AuthoriseUser);
})

test('Instance of AuthoriseUserByRoleStream', function (t) {
  t.plan(1);
  t.ok(authoriseUserStreamBuilder('su')() instanceof AuthoriseUserByRole);
})
