var fs = require('fs');
var fileList = require('./file_list');

function readFileList(dir, done) {
    fileList(dir, function (err, files) {
        var i = 0;
        var results = {};
        var filesLength = files.length;

        (function next() {
            var file = files[i++];

            if (!file) {
                done(null, results);
                return;
            }

            fs.readFile(file, function (err, data) {
                var key = file;
                
                results[key] = data;
                next();
            });
        })();
    });
}

module.exports = readFileList;
