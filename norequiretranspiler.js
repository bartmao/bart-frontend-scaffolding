var through2 = require('through2');
var buffer = require('Buffer');

// TODO: 1. defaults, 2. some non-export class,...
function norequiretranspiler() {
    var allExports = {};
    return through2.obj(function (file, enc, cb) {
        var content = file.contents.toString();
        var newContent = '';

        var arr = content.split('\n');
        // abandon 'define' scope
        var result = /function \(require, exports(,\s(\w+?))*\)/.exec(arr[0]);

        for (var i = 1; i < arr.length - 1; i++) {
            if (i == 2) continue;
            arr[i] = arr[i].substr(4, arr[i].length - 4);
            if (!arr[i].startsWith('exports.')) {
                if (result[2] == undefined) {
                    newContent += arr[i] + '\n';
                }
                else {
                    var exports = usedExports(result, arr[i]);
                    var s = arr[i];
                    exports.forEach(v => {
                        s = s.replace(v + '.', '');
                    });
                    newContent += s + '\n';
                }
            }
        }

        file.contents = Buffer.from(newContent);
        console.log(newContent);
        console.log(content);
        this.push(file);
        cb();
    });
}

function usedExports(matches, statement) {
    var arr = [];
    for (var i = 2; i < matches.length; i++) {
        if (statement.indexOf(matches[i] + '.') > -1)
            arr.push(matches[i]);
    }
    return arr;
}

module.exports = norequiretranspiler;