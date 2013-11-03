var User = require('../model/user.js');

function getUser(store) {
  return function (req, res, done) {
    var user_id = req.session.get('current_user_id');
    var user;

    if (user_id) {
      user = new User(store);
      user.find({ user_id: user_id }, function (err, user) {
        if (err) {
          done(err);
        }
        else {
          req.current_user = user;
          done();
        }
      });
    }
    else {
      done();
    }
  };
};

module.exports = getUser;
