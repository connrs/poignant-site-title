function Transaction(connect, done) {
  this._connect = connect;
  this._done = done;
  this._connect(this._onConnect.bind(this));
}

Transaction.prototype._onConnect = function (err, client, returnClient) {
  this._client = client;
  this._returnClient = returnClient;

  if (err) {
    this._done(err);
  }
  else {
    this._begin();
  }
};

Transaction.prototype._begin = function () {
  this._client.query('BEGIN', [], this._onBegin.bind(this));
};

Transaction.prototype._onBegin = function (err, results) {
  if (err) {
    this._destroyTransaction(err);
  }
  else {
    this._startTransaction();
  }
};

Transaction.prototype._destroyTransaction = function (err) {
  this._returnClient(err);
  this._done(err);
};

Transaction.prototype._startTransaction = function () {
  this._createClientWrapper();
  this._done(null, this._clientWrapper);
};

Transaction.prototype._createClientWrapper = function () {
  this._clientWrapper = {
    query: this._wrappedQuery.bind(this),
    commit: this._wrappedCommit.bind(this),
    rollback: this._wrappedRollback.bind(this)
  };
};

Transaction.prototype._wrappedQuery = function () {
  var args = Array.prototype.slice.call(arguments);
  var cb = args.pop();

  args.push(this._onWrappedQuery.bind(this, cb));
  this._client.query.apply(this._client, args);
};

Transaction.prototype._onWrappedQuery = function (cb, err, results) {
  if (err) {
    cb(err, null, this._clientWrapper);
  }
  else {
    cb(null, results, this._clientWrapper);
  }
};

Transaction.prototype._wrappedCommit = function (cb) {
  this._client.query('COMMIT', [], this._endTransaction.bind(this, cb));
};

Transaction.prototype._endTransaction = function (cb, err, results) {
  this._returnClient(err);
  cb(err);
};

Transaction.prototype._wrappedRollback = function (cb) {
  this._client.query('ROLLBACK', [], this._endTransaction.bind(this, cb));
};

function transaction(connect, done) {
  return new Transaction(connect, done);
}

module.exports = transaction;
