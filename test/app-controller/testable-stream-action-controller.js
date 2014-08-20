var StreamActionController = require('app/controller/stream-action');

function TestableStreamActionController(options) {
  options = options || {};
  StreamActionController.apply(this, arguments);
  this.setRoutes([
    ['GET', '/', this._createActionStream('index')]
  ])
}

TestableStreamActionController.prototype = Object.create(StreamActionController.prototype, {
  constructor: { value: TestableStreamActionController }
});

TestableStreamActionController.prototype.getConfig = function () {
  return this._config;
};

TestableStreamActionController.prototype.getNavigation = function () {
  return this._navigation;
};

TestableStreamActionController.prototype.index = function (obj, done) {
  obj.output = 'IRGOODTESTPASS';
  done(null, obj);
};

module.exports = TestableStreamActionController;
