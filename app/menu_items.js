function initMenuItems(app, callback) {
    var query = [];
    query.push('SELECT mi.menu_item_id, mi.name, mi.url, mi.title, mi.comment');
    query.push('FROM menu_item mi');
    query.push('INNER JOIN software_version_menu_item svmi ON svmi.menu_item_id = mi.menu_item_id AND svmi.deleted IS NULL');
    query.push('AND svmi.software_version_id = $1');
    query.push('INNER JOIN software_version sv ON sv.software_version_id = svmi.software_version_id AND sv.deleted IS NULL');
    query.push('WHERE mi.deleted IS NULL');
    app.dbClient.query(query.join('\n'), [app.config.softwareVersion], function (err, results) {
        if (err) {
            callback(err);
        }
        else {
            app.navigation = results.rows;
            callback();
        }
    });
}

module.exports = initMenuItems;
