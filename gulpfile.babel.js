'use strict'

let gulp = require('gulp')
let browserify = require('browserify')
let source = require('vinyl-source-stream')
let babelify = require('babelify')
let babel = require('gulp-babel')
let eslint = require('gulp-eslint')

let BUILD_FOLDER = './public/'
let argv = require('yargs').alias('e', 'example').default('e', 'example1').argv

// Build JS and JSX and copy it to build folder
gulp.task('js', function() {
  return browserify(`./${argv.example}/main-client.jsx`, {
    extensions: ['.jsx']
  }).transform(babelify.configure({
    stage: 0
  })).bundle()
    .pipe(source('main.js'))
    .pipe(gulp.dest(BUILD_FOLDER + 'js/'))
})

gulp.task('build-dist', function() {
  return gulp.src('lib/**/*.jsx')
    .pipe(babel({
      stage: 0
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('html', function() {
  return gulp.src('./html/index.html')
    .pipe(gulp.dest(BUILD_FOLDER))
})

gulp.task('build-example', ['js', 'html'])

// Main task to run
gulp.task('watch', ['build-example'], function() {
  gulp.watch(`./${argv.example}/**/*`, ['js'])
  gulp.watch('./lib/**/*', ['js'])
})

gulp.task('eslint', () => {
  return gulp.src([
    'gulpfile.babel.js',
    'lib/**/*.js',
    'lib/**/*.jsx',
    'example1/**/*.js',
    'example1/**/*.jsx',
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
})
