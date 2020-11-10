const gulp = require('gulp');
const babel = require('gulp-babel');
const css = require('gulp-clean-css');
const del = require('del');
const less = require('gulp-less');
const preprocess = require('gulp-preprocess');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const webpack = require('webpack');

const config = require('./config');

function assets() {
  return gulp.src([`${config.paths.src}/assets/**/*`])
    .pipe(gulp.dest(`${config.paths.dest}/assets`))
}

function copy() {
  return gulp.src([
    `${config.paths.src}/proxy.js`,
    `${config.paths.src}/run.js`
  ])
    .pipe(sourcemaps.init())
    .pipe(preprocess({ context: config.replace }))
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    .pipe(uglify({ mangle: false }))
    .pipe(sourcemaps.write('.'))
    .pipe(preprocess({ context: config.replace }))
    .pipe(gulp.dest(config.paths.dest));
}

function clean(done) {
  del([
    `${config.paths.dest}/**/*`,
    `!${config.paths.dest}/README.md`
  ], { force: true })
  .then(paths => done());
}

function html() {
  return gulp.src([`${config.paths.src}/index.html`])
    .pipe(preprocess({ context: config.replace }))
    .pipe(gulp.dest(config.paths.dest));
}

function scripts(done) {
  webpack(require('./webpack.config'), (err, stats) => {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return done();
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(info.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings)
    }

    console.log(stats.toString({
      chunks: false,
      colors: true
    }));

    done();
  });
}

function styles() {
  return gulp.src([`${config.paths.src}/style.less`])
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(css())
    .pipe(rename({ basename: 'style' }))
    .pipe(preprocess({ context: config.replace }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.paths.dest));
}

function watch() {
  gulp.watch(`${config.paths.src}/**/*.js`, gulp.parallel(copy));
  gulp.watch([`${config.paths.src}/**/*.ts`, `${config.paths.src}/run.html`], gulp.parallel(scripts));
  gulp.watch(`${config.paths.src}/index.html`, gulp.parallel(html));
  gulp.watch(`${config.paths.src}/**/*.less`, gulp.parallel(styles));
  gulp.watch(`${config.paths.src}/assets/**/*`, gulp.parallel(assets));
}

const build = gulp.series(
  clean,
  gulp.parallel(
    assets, copy, html, scripts, styles
  )
);

gulp.task('build', build);
gulp.task('watch', gulp.series(build, watch));
gulp.task('default', build);
