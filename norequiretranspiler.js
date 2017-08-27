var through2 = require('through2');
var buffer = require('Buffer');

function norequiretranspiler() {
    var allExports = {};
    return through2.obj(function (file, enc, cb) {
        var content = file.contents.toString();
        var newContent = '';

        var arr = content.split('\n');
        // abandon 'define' scope
        var result = /function \(require, exports,? ?(\w+?)*\)/.exec(arr[0]);
        
        for (var i = 1; i < arr.length - 1; i++) {
            if (i == 2) continue;
            arr[i] = arr[i].substr(4, arr[i].length - 4);
            if (!arr[i].startsWith('exports.'))
                newContent += arr[i] + '\n';
        }

        file.contents = Buffer.from(newContent);
        console.log(newContent);
        console.log(content);
        this.push(file);
        cb();
    });
}

module.exports = norequiretranspiler;