/// <reference path="typings/node/node.d.ts"/>	
var path = require('path');

var gulp = require('gulp');

var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');

var slowPattern = './styles/chained-adder.less';

gulp.task('fast', function () {
	return gulp.src(['./styles/[^_]*.less', '!' + slowPattern])
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write('./', { includeContent: false }))
		.pipe(gulp.dest('./styles'));
});

// chained-adder.less is slow enough that it should get a separate task,
// so that changes to other files don't need to wait for it. It also has
// no need for a source map; the mapping conveys no useful information.
gulp.task('slow', function () {
	return gulp.src(slowPattern)
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(gulp.dest('./styles'));
});
