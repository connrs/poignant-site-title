function reduce(arr, func) {
  var run = function (prev, curr) {
    return func(prev, curr);
  };

  return arr.reduce(run);
}

function couple(previous, current) {
  return previous.pipe(current);
}

function plumb(streams) {
  return reduce(streams, couple);
}

module.exports = plumb;
