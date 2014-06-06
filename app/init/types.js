function initDBTypes(app, callback) {
  var typesCount = 1;
  var queries = {};
  var types = {};

  app.types = {}
  queries.postStatus = 'SELECT post_status_type_id id, name, comment FROM post_status_type WHERE deleted_at IS NULL';
  queries.commentStatus = 'SELECT comment_status_type_id id, name FROM comment_status_type WHERE deleted_at IS NULL';

  Object.keys(queries).forEach(function (key) {
    app.storeClient.client(function (err, query) {
      if (err) {
        throw err;
      }

      query(queries[key], function (err, results) {
      if (err) {
        throw err;
        return;
      }

      typesCount--;
      app.types[key] = results.rows;

      if (typesCount === 0) {
        callback();
      }
      });
    });
  });
}

module.exports = initDBTypes;
