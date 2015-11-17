var gulp          = require('gulp');
var tsconfig      = require('gulp-tsconfig-files');
var exec          = require('child_process').execSync;
var install       = require('gulp-install');
var runSequence   = require('run-sequence');
var del           = require('del');
var uglify        = require('gulp-uglify');
var useref        = require('gulp-useref');
var rename        = require('gulp-rename');
var debug         = require('gulp-debug');
var concat        = require('gulp-concat');
var plumber       = require('gulp-plumber');
var watch         = require('gulp-watch');
var changed       = require('gulp-changed');
var templateCache = require('gulp-angular-templatecache');
var deploy        = require('gulp-gh-pages');
var purify        = require('gulp-purifycss');
var concatCss     = require('gulp-concat-css');

/** Destination of the client/server distribution */
var dest = 'dist/';

function run(command, cb) {
  console.log('Run command: ' + command);
  try {
    exec(command);
    cb();
  } catch (err) {
    console.log('### Exception encountered on command: ' + command);
    console.log(err.stdout.toString());
    console.log('####################################');
    cb();
    throw err;
  }
}

/** Create a new distribution by copying all required CLIENT files to the dist folder. */
gulp.task('dist_client', function() {
    // Copy client side files
    // Copy app, images, css, data and swagger
    gulp.src('public/app/**/*.js*')
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/app/'));
    gulp.src('public/css/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/css/'));
    gulp.src('public/data/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/data/'));
    gulp.src('public/swagger/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/swagger/'));
    gulp.src('./public/images/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/images/'));
    // Copy index files and favicon        
    gulp.src(['./public/*.html', './public/favicon.ico', './public/mode-json.js'])
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/'));
    // Copy bower components of csweb, and others (ignoring any linked csweb files)
    gulp.src('public/bower_components/csweb/dist-bower/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/bower_components/csweb/dist-bower/'));
    gulp.src(['public/bower_components/**/*.*', '!public/bower_components/csweb/**/*.*'])
        .pipe(plumber())
        .pipe(gulp.dest(dest + 'public/bower_components/'));
});

/** Create a new distribution by copying all required SERVER files to the dist folder. */
gulp.task('dist_server', function() {
    // Copy server side files
    gulp.src(['./server.js', './server.js.map', './configuration.json', './LICENSE'])
        .pipe(plumber())
        .pipe(gulp.dest(dest));
    // Copy npm modules of csweb, and others (ignoring any linked csweb files)
    // gulp.src('node_modules/csweb/node_modules/async/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/async/'))
    //     .pipe(gulp.dest(dest + 'node_modules/async/'));
    // gulp.src('node_modules/csweb/node_modules/bcryptjs/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/bcryptjs/'))
    //     .pipe(gulp.dest(dest + 'node_modules/bcryptjs/'));
    // gulp.src('node_modules/csweb/node_modules/body-parser/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/body-parser/'))
    //     .pipe(gulp.dest(dest + 'node_modules/body-parser/'));
    // gulp.src('node_modules/csweb/node_modules/cors/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/cors/'))
    //     .pipe(gulp.dest(dest + 'node_modules/cors/'));
    // gulp.src('node_modules/csweb/node_modules/express/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/express/'))
    //     .pipe(gulp.dest(dest + 'node_modules/express/'));
    // gulp.src('node_modules/csweb/node_modules/fs-extra/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/fs-extra/'))
    //     .pipe(gulp.dest(dest + 'node_modules/fs-extra/'));
    // gulp.src('node_modules/csweb/node_modules/jwt-simple/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/jwt-simple/'))
    //     .pipe(gulp.dest(dest + 'node_modules/jwt-simple/'));
    // gulp.src('node_modules/csweb/node_modules/kerberos/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/kerberos/'))
    //     .pipe(gulp.dest(dest + 'node_modules/kerberos/'));
    // gulp.src('node_modules/csweb/node_modules/mongodb/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/mongodb/'))
    //     .pipe(gulp.dest(dest + 'node_modules/mongodb/'));
    // gulp.src('node_modules/csweb/node_modules/mqtt/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/mqtt/'))
    //     .pipe(gulp.dest(dest + 'node_modules/mqtt/'));
    // gulp.src('node_modules/csweb/node_modules/mqtt-router/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/mqtt-router/'))
    //     .pipe(gulp.dest(dest + 'node_modules/mqtt-router/'));
    // gulp.src('node_modules/csweb/node_modules/proj4/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/proj4/'))
    //     .pipe(gulp.dest(dest + 'node_modules/proj4/'));
    // gulp.src('node_modules/csweb/node_modules/serve-favicon/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/serve-favicon/'))
    //     .pipe(gulp.dest(dest + 'node_modules/serve-favicon/'));
    // gulp.src('node_modules/csweb/node_modules/sift/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/sift/'))
    //     .pipe(gulp.dest(dest + 'node_modules/sift/'));
    // gulp.src('node_modules/csweb/node_modules/socket.io/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/socket.io/'))
    //     .pipe(gulp.dest(dest + 'node_modules/socket.io/'));
    // gulp.src('node_modules/csweb/node_modules/underscore/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/underscore/'))
    //     .pipe(gulp.dest(dest + 'node_modules/underscore/'));
    // gulp.src('node_modules/csweb/node_modules/chokidar/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/chokidar/'))
    //     .pipe(gulp.dest(dest + 'node_modules/chokidar/'));
    // gulp.src('node_modules/csweb/node_modules/winston/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/winston/'))
    //     .pipe(gulp.dest(dest + 'node_modules/winston/'));
    // gulp.src('node_modules/csweb/node_modules/xml2js/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/xml2js/'))
    //     .pipe(gulp.dest(dest + 'node_modules/xml2js/'));
    // gulp.src('node_modules/csweb/node_modules/lru-cache/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/lru-cache/'))
    //     .pipe(gulp.dest(dest + 'node_modules/lru-cache/'));
    // gulp.src('node_modules/csweb/node_modules/request/**/*.*')
    //     .pipe(plumber())
    //     .pipe(changed(dest + 'node_modules/request/'))
    //     .pipe(gulp.dest(dest + 'node_modules/request/'));
    
    gulp.src(['node_modules/**/*.*', '!node_modules/csweb/**/*.*'])
        .pipe(plumber())
        .pipe(changed(dest + 'node_modules/'))
        .pipe(gulp.dest(dest + 'node_modules/'));
    return gulp.src('node_modules/csweb/dist-npm/**/*.*')
        .pipe(plumber())
        .pipe(changed(dest + 'node_modules/csweb/dist-npm/'))
        .pipe(gulp.dest(dest + 'node_modules/csweb/dist-npm/'));
});

/** Create a new distribution by copying all required CLIENT+SERVER files to the dist folder. */
gulp.task('dist', ['dist_client', 'dist_server']);

gulp.task('update_tsconfig', function() {
  return gulp.src(['./**/*.ts',
            '!./node_modules/**/*.ts',
            '!./dist/**/*.*',
            '!./public/bower_components/**/*.d.ts',
        ],
      {base: ''})
    .pipe(tsconfig({
      path:         'tsconfig.json',
      relative_dir: '',
    }));
});

gulp.task('tsc', function(cb) {
  return run('tsc -p .', cb);
});

// Install required npm and bower installs for example folder
gulp.task('install', function(cb) {
  return gulp.src([
      './package.json',       // npm install
      './public/bower.json',  // bower install
    ])
    .pipe(install(cb));
});

/** Initialiaze the project */
gulp.task('init', function(cb) {
  runSequence(
    'update_tsconfig',
    'tsc',
    cb
  );
});

// Gulp task upstream...
// Configure gulp scripts
// Output application name
var appName    = 'csWebApp';
var path2csWeb = './../csWeb';


gulp.task('clean', function(cb) {
    // NOTE Careful! Removes all generated javascript files and certain folders.
    del([
        'dist',
        'public/**/*.js',
        'public/**/*.js.map'
    ], {
        force: true
    }, cb);
});

/** Deploy it to the github pages */
gulp.task('deploy-githubpages', function() {
    return gulp.src(dest + 'public/**/*')
        .pipe(deploy({
            branch: 'master',
            cacheDir: '.deploy'
        }));
});

// var watchTS = gulp.watch('./**/*.ts');
// watchTS.on('added', function(event) {
//   console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
//   update_tsconfig
// });

gulp.task('watch', function() {
    gulp.watch(path2csWeb + 'csServerComp/ServerComponents/**/*.js', ['copy_csServerComp']);
    gulp.watch(path2csWeb + 'csServerComp/Scripts/**/*.ts', ['copy_csServerComp_scripts']);
    //gulp.watch(path2csWeb + 'csServerComp/ServerComponents/**/*.d.ts', ['built_csServerComp.d.ts']);
    gulp.watch(path2csWeb + 'csServerComp/ServerComponents/dynamic/ClientConnection.d.ts', ['built_csServerComp.d.ts']);

    gulp.watch(path2csWeb + 'csComp/includes/**/*.scss', ['sass']);
    gulp.watch(path2csWeb + 'csComp/js/**/*.js', ['built_csComp']);
    gulp.watch(path2csWeb + 'csComp/js/**/*.d.ts', ['built_csComp.d.ts']);
    gulp.watch(path2csWeb + 'csComp/**/*.tpl.html', ['create_templateCache']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.css', ['include_css']);
    gulp.watch(path2csWeb + 'csComp/includes/**/*.js', ['include_js']);
    gulp.watch(path2csWeb + 'csComp/includes/images/*.*', ['include_images']);
});

gulp.task('all', ['create_templateCache', 'copy_csServerComp', 'built_csServerComp.d.ts', 'copy_csServerComp_scripts', 'built_csComp', 'built_csComp.d.ts', 'include_css', 'include_js', 'include_images', 'copy_example_scripts', 'sass']);

gulp.task('deploy', ['dist_client', 'deploy-githubpages']);

gulp.task('default', ['all', 'watch']);
