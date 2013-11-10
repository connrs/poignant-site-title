function collectReadable(readable, callback) {
  var data = [];
  readable.on('readable', onReadableReadable.bind(null, readable, data));
  readable.on('end', onReadableEnd.bind(null, callback, data));
  readable.on('error', callback);
}

function onReadableReadable(readable, data) {
  var chunk = readable.read();

  while (chunk) {
    data.push(chunk);
    chunk = readable.read();
  }
}

function onReadableEnd(callback, data) {
  callback(null, Buffer.concat(data));
}

module.exports = collectReadable;
