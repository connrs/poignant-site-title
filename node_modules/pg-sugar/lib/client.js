function Client(connect, done) {
  this._connect = connect;
  this._done = done;
  this._connect(this._onConnect.bind(this));
}

Client.prototype._onConnect = function (err, client, returnClient) {
  this._client = client;
  this._returnClient = returnClient;

  if (err) {
    this._done(err);
  }
  else {
    this._done(null, this._wrappedQuery.bind(this));
  }
};

Client.prototype._wrappedQuery = function () {
  var args = Array.prototype.slice.call(arguments);
  var cb = args.pop();

  args.push(this._onWrappedQuery.bind(this, cb));
  this._client.query.apply(this._client, args);
};

Client.prototype._onWrappedQuery = function (cb, err, results) {
  this._returnClient(err);
  cb(err, results);
};

function client(connect, done) {
  return new Client(connect, done);
}

module.exports = client;
