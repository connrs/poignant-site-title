var fs = require('fs');

function fileList(dir, done) {
    var results = [];

    fs.readdir(dir, function (err, list) {
        if (err) {
            done(err);
            return;
        }

        var i = 0;

        (function next() {
            var file = list[i++];

            if (!file) {
                done(null, results);
                return;
            }

            file = dir + '/' + file;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    fileList(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    })
                }
                else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
}

module.exports = fileList;
