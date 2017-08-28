var gulp = require('gulp');
var tsc = require('gulp-typescript');
var browserify = require('browserify');
var tsify = require('tsify');
var source = require('vinyl-source-stream');
var transpiler = require('./nomoduleloadertranspiler');

// gulp.task('server', function () {
//     return gulp.src('src/server/*.ts')
//         .pipe(tsc({
//             "module": "commonjs",
//             "target": "es6",
//             "noImplicitAny": false,
//             "sourceMap": false
//         }))
//         .pipe(gulp.dest("bin/server/"));
// });

gulp.task('browser', function () {
    var jsFolder = 'bin/browser/js/';

    // For separate files manually loading js
    // a not good practice anyway
    return gulp.src('src/browser/js/*.ts')
        .pipe(tsc({
            "module": "amd",
            "target": "es5",
            "noImplicitAny": false,
            "sourceMap": false
        }))
        .pipe(transpiler.buildDependencies())
        .pipe(transpiler.transpiling())
        .pipe(gulp.dest(jsFolder));

    // For separate files using requirejs
    // return gulp.src('src/browser/js/*.ts')
    //     .pipe(tsc({
    //         "module": "amd",
    //         "target": "es5",
    //         "noImplicitAny": false,
    //         "sourceMap": false
    //     }))
    //     .pipe(gulp.dest(jsFolder));

    // For bundle to a single file
    // return browserify({
    //     basedir: '.',
    //     //debug: true,
    //     entries: ['src/browser/js/main.ts'],
    //     cache: {},
    //     packageCache: {}
    // })
    //     .plugin(tsify, {
    //         "module": "commonjs",
    //         "target": "es5",
    //         "noImplicitAny": false,
    //         "sourceMap": false
    //     })
    //     .bundle()
    //     .pipe(source('main.js'))
    //     .pipe(gulp.dest(jsFolder));
});

gulp.task('default', ['browser']);