var Transform = require('stream').Transform;

function BarnacleMode(fuse, options) {
  if (!(this instanceof BarnacleMode)) {
    return new BarnacleMode(fuse, options);
  }

  options = options || {};
  options.objectMode = true;

  Transform.call(this, options);
  if (options.toBuffer) {
    this._readableState.objectMode = false;
  }
  this._fuse = fuse;
}

BarnacleMode.prototype = Object.create(Transform.prototype, {
  constructor: { value: Transform }
});

BarnacleMode.prototype._transform = function (obj, encoding, callback) {
  this._fuse(obj, this._pushFused.bind(this, callback));
};

BarnacleMode.prototype._pushFused = function (callback, err, fused) {
  if (err) {
    callback(err);
  }
  else {
    this.push(fused);
    callback();
  }
};

function barnacleMode(fuse, toBuffer) {
  var ExtendedBarnacleMode = function (fuse, toBuffer) {
    if (!(this instanceof ExtendedBarnacleMode)) {
      return new ExtendedBarnacleMode(fuse, toBuffer);
    }

    BarnacleMode.call(this, fuse, { toBuffer: !!toBuffer });
  };

  ExtendedBarnacleMode.prototype = Object.create(BarnacleMode.prototype, {
    constructor: { value: BarnacleMode }
  });

  return function () {
    return new ExtendedBarnacleMode(fuse, toBuffer);
  };
}

module.exports = barnacleMode;
