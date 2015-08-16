'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var babel = require('gulp-babel');

var BUILD_FOLDER = './public/';
var argv = require('yargs').alias('e', 'example').default('e', 'example1').argv;

// Build JS and JSX and copy it to build folder
gulp.task('js', function() {
    return browserify(`./${argv.example}/main-client.jsx`, {
            extensions: ['.jsx']
        })
        .transform(babelify.configure({
          stage: 0
        }))
        .bundle()
        .pipe(source('main.js'))
        .pipe(gulp.dest(BUILD_FOLDER + 'js/'));
});

gulp.task('build-dist', function() {
    return gulp.src('lib/**/*.jsx')
        .pipe(babel({
            stage: 0
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('html', function() {
    return gulp.src('./html/index.html')
        .pipe(gulp.dest(BUILD_FOLDER));
});

gulp.task('build-example', ['js', 'html']);

// Main task to run
gulp.task('watch', ['build-example'], function() {
    gulp.watch(`./${argv.example}/**/*`, ['js']);
    gulp.watch('./lib/**/*', ['js']);
});
