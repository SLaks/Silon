/// <reference path="typings/node/node.d.ts"/>	
var path = require('path');

var gulp = require('gulp');

var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function () {
	return gulp.src('./styles/[^_]*.less')
		.pipe(sourcemaps.init())
		.pipe(less({
			paths: [path.join(__dirname, 'less', 'includes')]
		}))
		.pipe(autoprefixer())
		.pipe(sourcemaps.write('./', { includeContent: false }))
		.pipe(gulp.dest('./styles'));
});
