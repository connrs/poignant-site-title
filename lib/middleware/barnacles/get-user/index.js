var BarnacleMode = require('barnacle-mode');
var User = require('../../../model/user.js');

function getUser(store) {
  return new BarnacleMode(fuse.bind(null, store))();
};

function fuse(store, o, done) {
  var user;
  var user_id;

  user_id = o.session.get('current_user_id');
  o.current_user = null;

  if (!user_id) {
    done(null, o);
    return;
  }

  user = new User(store);
  user.find({ user_id: user_id }, function (err, user) {
    if (err) {
      done(err);
      return;
    }

    o.current_user = user;
    done(null, o);
  });
}

module.exports = getUser;
