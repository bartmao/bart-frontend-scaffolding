var through2 = require('through2');
var buffer = require('Buffer');

// TODO: 1. defaults, 2. some non-export class,...
function nomoduleloaderTranspiler() {
    // var allExports = {};
    // return through2.obj(function (file, enc, cb) {
    //     var content = file.contents.toString();
    //     var newContent = '';

    //     var arr = content.split('\n');
    //     // abandon 'define' scope
    //     var result = /function \(require, exports(,\s(\w+?))*\)/.exec(arr[0]);

    //     for (var i = 1; i < arr.length - 1; i++) {
    //         if (i == 2) continue;
    //         arr[i] = arr[i].substr(4, arr[i].length - 4);
    //         if (!arr[i].startsWith('exports.')) {
    //             if (result[2] == undefined) {
    //                 newContent += arr[i] + '\n';
    //             }
    //             else {
    //                 var exports = usedExports(result, arr[i]);
    //                 var s = arr[i];
    //                 exports.forEach(v => {
    //                     s = s.replace(v + '.', '');
    //                 });
    //                 newContent += s + '\n';
    //             }
    //         }
    //     }

    //     file.contents = Buffer.from(newContent);
    //     console.log(newContent);
    //     console.log(content);
    //     this.push(file);
    //     cb();
    // });
}

function usedExports(matches, statement) {
    var arr = [];
    for (var i = 2; i < matches.length; i++) {
        if (statement.indexOf(matches[i] + '.') > -1)
            arr.push(matches[i]);
    }
    return arr;
}

// currently not support same name module under different folders
function buildDependencies() {
    return through2.obj(function (file, enc, cb) {
        var fp = file.history[0];
        var fn = fp.substring(fp.lastIndexOf('/') + 1, fp.lastIndexOf('.'));
        var txt = file.contents.toString();
        var firstLine = txt.substr(0, txt.indexOf('\n'));
        var dependencyNames = /define\(\[(.*?)\]/.exec(firstLine)[1]
            .split(', ')
            .map(d => d.substring(1, d.length - 1))
            .slice(2);
        // allow plain name not including path currently
        dependencyNames = dependencyNames.map(d => {
            var i = d.lastIndexOf('/');
            if (i == -1) return d;
            else return d.substring(i + 1, d.length - 1);
        })

        var dependencyAlias = /function \((.+?)\)/.exec(firstLine)[1]
            .split(', ')
            .slice(2);
        var moduleInfo = { fn: fn, exports: [], dependencies: [] };
        if (dependencyNames.length > 0) {
            for (var i = 0; i < dependencyNames.length; i++) {
                moduleInfo.dependencies.push({ key: dependencyNames[i], value: dependencyAlias[i] });
            }
        }
        var reg = /exports\.(.*) = .*/g;
        var match = reg.exec(txt);
        while (match != null) {
            moduleInfo.exports.push(match[1]);
            match = reg.exec(txt);
        }

        // For enums
        var reg1 = /\(exports\.(.*) = {}\)/g;
        var match1 = reg1.exec(txt);
        while (match1 != null) {
            moduleInfo.exports.push(match1[1]);
            match1 = reg1.exec(txt);
        }

        file['moduleInfo'] = moduleInfo;

        this.push(file);
        cb();
    });
}

function transpiling() {
    return through2.obj(function (file, enc, cb) {
        if (file.moduleInfo) {
            var contents = file.contents.toString().trim();
            var newContent = '';
            var fn = file.moduleInfo.fn;
            var arr = contents.split('\n');
            newContent += '(function(){\n'
            var spaceCount = arr[1].search(/\S/);
            newContent += new Array(spaceCount + 1).join(' ') + 'if(!window.exports) window.exports = {};\n';
            newContent += new Array(spaceCount + 1).join(' ') + `if(!window.exports['${fn}']) window.exports['${fn}'] = {};\n`;
            newContent += new Array(spaceCount + 1).join(' ') + `var exports = window.exports['${fn}'];\n`;
            for (var i = 1; i < arr.length - 1; ++i) {
                if (i == 2) continue;
                // add definition of exports if not exist
                // noop
                if (arr[i].trim().startsWith('exports.')) {
                }
                else if (arr[i].trim().search(/\(exports\.(.+)? = {}\)\);$/) > -1) {
                }

                // replace import definitions
                var dep = file.moduleInfo.dependencies;
                dep.forEach(d => {
                    var reg = new RegExp(`\\b${d.value}\\b\\.`, 'g');
                    arr[i] = arr[i].replace(reg, `window.exports['${d.key}'].`);
                });

                newContent += arr[i] + '\n';
            }
            newContent += '})();\n';
            newContent += `//# sourceURL=${fn}.js\n`;
            file.contents = Buffer.from(newContent);

            // console.log(contents);
            // console.log(newContent);
        }
        this.push(file);
        cb();
    });
}

module.exports = {buildDependencies, transpiling};
