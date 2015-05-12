/// <reference path="typings/node/node.d.ts"/>	
var path = require('path');

var gulp = require('gulp');

var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var replace = require('gulp-replace');

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
// no need for any source map; the mapping conveys no useful information
// (omitting the source map also lets me skip running this when changing
// other lines of _theme.less, and avoids breaking replace()).
gulp.task('slow', function () {
	return gulp.src(slowPattern)
		.pipe(less())
		.pipe(autoprefixer())
		// If an input appears multiple times in leaf nodes below an
		// operator other than OR & NAND (which split their operands
		// across commas), the generated selector will duplicate the
		// inputs, preventing it from matching anything.  This regex
		// removes the extra duplicate parts.
		.pipe(replace(/(^|\n|~ )([^~,]+)( ~[^,{]*)? ~ \2/g, '$1$2$3'))
		.pipe(gulp.dest('./styles'));
});
