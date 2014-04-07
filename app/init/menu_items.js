function initMenuItems(app, callback) {
  var sql = [];
  sql.push('SELECT mi.menu_item_id, mi.name, mi.url, mi.title, mi.comment');
  sql.push('FROM menu_item mi');
  sql.push('INNER JOIN software_version_menu_item svmi ON svmi.menu_item_id = mi.menu_item_id AND svmi.deleted IS NULL');
  sql.push('AND svmi.software_version_id = $1');
  sql.push('INNER JOIN software_version sv ON sv.software_version_id = svmi.software_version_id AND sv.deleted IS NULL');
  sql.push('WHERE mi.deleted IS NULL');
  app.storeClient.client(function (err, query) {
    if (err) {
      throw err;
    }

    query(sql.join('\n'), [app.config.softwareVersion], function (err, results) {
      if (err) {
        callback(err);
      }
      else {
        app.navigation = results.rows;
        callback();
      }
    });
  });
}

module.exports = initMenuItems;
