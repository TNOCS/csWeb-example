var gulp          = require('gulp');
var tsconfig      = require('gulp-tsconfig-files');
var exec          = require('child_process').execSync;
var install       = require('gulp-install');
var runSequence   = require('run-sequence');
var del           = require('del');
var insert        = require('gulp-insert');
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
var sass          = require('gulp-sass');
var purify        = require('gulp-purifycss');
var karma         = require('karma');
var concatCss     = require('gulp-concat-css');

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

// This task updates the typescript dependencies on tsconfig file for csComp
gulp.task('comp_tsconfig_files', function() {
  gulp.src(['./csComp/**/*.ts',
            './csComp/**/*.ts',
            '!./csComp/dist/csComp.d.ts',
            '!./csComp/js/**/*.d.ts',
            '!./csComp/js/**/*.js',
            '!./csComp/node_modules/**/*.ts',
        ],
      {base: 'csComp'})
    .pipe(tsconfig({
      path:         'csComp/tsconfig.json',
      relative_dir: 'csComp/',
    }));
});

gulp.task('thirdparty-js', function() {
    return gulp.src('./csComp/includes/js/*.js')
        .pipe(concat('csThirdparty.js'))
        .pipe(plumber())
        // .pipe(uglify())
        // .pipe(rename({
        //     suffix: '.min'
        // }))
        .pipe(gulp.dest('./dist-bower'));
});

gulp.task('thirdparty-css', function() {
    return gulp.src('./csComp/includes/css/*.css')
        .pipe(concatCss('csThirdparty.css'))
        .pipe(gulp.dest('./dist-bower'));
});

// This task compiles typescript on csComp
gulp.task('comp_tsc', function(cb) {
  return run('tsc -p csComp', cb);
});

// This task updates the typescript dependencies on tsconfig file for csServerComp
gulp.task('servercomp_tsconfig_files', function() {
  gulp.src(['csServerComp/**/*.ts',
            '!csServerComp/OfflineSearch/**/*.ts',
            '!csServerComp/ServerComponents/**/*.d.ts',
            '!csServerComp/node_modules/**/*.ts',
            '!csServerComp/Classes/*.d.ts',
        ],
      {base: 'csServerComp'})
    .pipe(tsconfig({
      path:         'csServerComp/tsconfig.json',
      relative_dir: 'csServerComp/',
    }));
});

// This task compiles typescript on csServerComp
gulp.task('servercomp_tsc', function(cb) {
  return run('tsc -p csServerComp', cb);
});

gulp.task('test_tsconfig_files', function() {
  gulp.src(['./test/**/*.ts',
            '!./test/node_modules/**/*.ts',
          ],
      {base: 'test'})
    .pipe(tsconfig({
      path:         'test/tsconfig.json',
      relative_dir: 'test/',
    }));
});

gulp.task('test_tsc', function(cb) {
  return run('tsc -p test', cb);
});

gulp.task('example_tsconfig_files', function() {
  return gulp.src(['./example/**/*.ts',
            '!./example/node_modules/**/*.ts',
            '!./example/dist/**/*.*',
            '!./example/public/bower_components/**/*.d.ts',
        ],
      {base: 'example'})
    .pipe(tsconfig({
      path:         'example/tsconfig.json',
      relative_dir: 'example/',
    }));
});

gulp.task('example_tsc', function(cb) {
  return run('tsc -p .', cb);
});

// Run required npm and bower installs for example folder
gulp.task('example_deps', function(cb) {
  return gulp.src([
      './package.json',       // npm install
      './public/bower.json',  // bower install
    ])
    .pipe(install(cb));
});

gulp.task('init', function(cb) {
  runSequence(
    'comp_tsconfig_files',
    'comp_tsc',
    'servercomp_tsconfig_files',
    'servercomp_tsc',
    //'example_deps',
    'built_csComp',
    'built_csComp.d.ts',
    'thirdparty-js',
    'thirdparty-css',
    'include_js',
    'include_css',
    'include_images',
    //'example_tsconfig_files',
    //'example_tsc',
    cb
  );
});

gulp.task('karma', function(cb) {
  new karma.Server({
    configFile: __dirname + '/test/karma.conf.js',
    singleRun: true,
  }, cb).start();
});

gulp.task('test', function() {
  runSequence(
      'built_csServerComp.d.ts',
      'built_csComp.d.ts',
      'test_tsconfig_files',
      'test_tsc',
      'karma'
    );
});

gulp.task('dev', ['?']);

gulp.task('start', ['?']);

// Gulp task upstream...
// Configure gulp scripts
// Output application name
var appName    = 'csWebApp';
var path2csWeb = './';

gulp.task('csspurify', function() {
    return gulp.src(path2csWeb + 'example/public/cs/css/csstyles.css')
        .pipe(purify([path2csWeb + 'example/public/cs/js/**/*.js', path2csWeb + 'example/**/*.html']))
        .pipe(gulp.dest(path2csWeb + 'example/public/cs/css/csclean.css'));
});

gulp.task('clean', function(cb) {
    // NOTE Careful! Removes all generated javascript files and certain folders.
    del([
        path2csWeb + 'csServerComp/ServerComponents/**/*.js',
        path2csWeb + 'csComp/js/**',
        path2csWeb + 'example/public/cs/**',
        path2csWeb + 'example/dist',
        path2csWeb + 'example/ServerComponents/**',
        path2csWeb + 'example/services/**',
        path2csWeb + 'example/Scripts/typings/cs/**/',
        path2csWeb + 'example/*.js',
        path2csWeb + 'test/csComp/**/*.js',
        path2csWeb + 'test/Scripts/typings/cs/**/',
    ], {
        force: true
    }, cb);
});

gulp.task('sass', function() {
    gulp.src(path2csWeb + 'csComp/includes/css/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path2csWeb + 'csComp/includes/css/'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower/'));
});

gulp.task('deploy-githubpages', function() {
    return gulp.src("path2csWeb + 'dist/**/*")
        .pipe(deploy({
            branch: 'master',
            cacheDir: '.deploy'
        }));
});

gulp.task('built_csComp', function() {
    return gulp.src(path2csWeb + 'csComp/js/**/*.js')
        // .pipe(debug({
        //     title: 'built_csComp:'
        // }))
        // .pipe(debug({title: 'before ordering:'}))
        // .pipe(order([
        //     "translations/locale-nl.js"
        // ]))
        // .pipe(debug({title: 'after ordering:'}))
        .pipe(concat('csComp.js'))
        .pipe(gulp.dest(path2csWeb + 'example/public/cs/js'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'));
});

gulp.task('compile_all', function() {
  /* runsequence('servercomp_tsc','comp_tsc','test_tsc'); insead ? */
  exec('cd ' + path2csWeb + 'csServerComp && tsc');
  exec('cd ' + path2csWeb + 'csComp && tsc');
  exec('tsc');
  exec('cd ' + path2csWeb + 'test && tsc');
});

//gulp.task('built', ['compile_all', 'default']);

gulp.task('copy_csServerComp', function() {
    return gulp.src('csServerComp/ServerComponents/**/*.js')
        //.pipe(concat('csServerComp.js'))
        //.pipe(changed(path2csWeb + 'dist-csServerComp/'))
        .pipe(gulp.dest(path2csWeb + 'dist-csServerComp'));
});

gulp.task('built_csServerComp.d.ts', function() {
    gulp.src(path2csWeb + 'dist-csServerComp/ServerComponents/**/*.d.ts')
        .pipe(plumber())
        .pipe(concat('csWeb.d.ts'))
        //.pipe(changed(path2csWeb + 'example/ServerComponents'))
        .pipe(gulp.dest(path2csWeb + 'dist-csServerComp'));
    //.pipe(gulp.dest('./public/cs/js'));
    gulp.src(path2csWeb + 'csServerComp/ServerComponents/**/*.d.ts')
        .pipe(changed(path2csWeb + 'test/Scripts/typings/cs'))
        .pipe(gulp.dest(path2csWeb + 'test/Scripts/typings/cs'));
});

gulp.task('copy_csServerComp_scripts', function() {
    return gulp.src(path2csWeb + 'csServerComp/Scripts/**/*.ts')
        //.pipe(concat('csComp.js'))
        .pipe(changed(path2csWeb + 'example/Scripts'))
        .pipe(gulp.dest(path2csWeb + 'example/Scripts'));
});

gulp.task('copy_example_scripts', function() {
    return gulp.src(path2csWeb + 'example/Scripts/**/*.ts')
        .pipe(changed(path2csWeb + 'test/Scripts'))
        .pipe(gulp.dest(path2csWeb + 'test/Scripts'));
});

gulp.task('built_csComp_classes', function() {
    return gulp.src(path2csWeb + 'csComp/classes/**/*.ts')
        // .pipe(debug({
        //     title: 'built_csComp_classes:'
        // }))
        // .pipe(debug({title: 'before ordering:'}))
        // .pipe(order([
        //     "translations/locale-nl.js"
        // ]))
        // .pipe(debug({title: 'after ordering:'}))
        .pipe(concat('csCompClasses.ts'))
        .pipe(changed(path2csWeb + 'csServerComp/classes'))
        .pipe(gulp.dest(path2csWeb + 'csServerComp/classes'));
});

gulp.task('built_csComp.d.ts', function() {
  return gulp.src(path2csWeb + 'csComp/js/**/*.d.ts')
        .pipe(plumber())
        .pipe(concat('csComp.d.ts'))
        .pipe(insert.prepend('/// <reference path="../leaflet/leaflet.d.ts" />\r\n'))
        .pipe(insert.prepend('/// <reference path="../crossfilter/crossfilter.d.ts" />\r\n'))
        .pipe(changed(path2csWeb + 'example/Scripts/typings/cs'))
        .pipe(gulp.dest(path2csWeb + 'example/Scripts/typings/cs'))
        .pipe(changed(path2csWeb + 'test/Scripts/typings/cs'))
        .pipe(gulp.dest(path2csWeb + 'test/Scripts/typings/cs'));
});

gulp.task('create_templateCache', function() {
    console.log('Creating templateCache.');
    var options = {
        module: appName,
        filename: 'csTemplates.js'
    };

    gulp.src(path2csWeb + 'csComp/**/*.tpl.html')
        .pipe(templateCache(options))
        .pipe(gulp.dest(path2csWeb + 'example/public/cs/js'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower'));
});

gulp.task('gh_pages', function() {
    // Create a distribution for the GitHub Pages.
    // Basically the same as the create_dist function, except that a different output folder is used.
    // http://yeoman.io/learning/deployment.html
    console.log('Creating distribution for GitHub Pages');
    console.log('Use the following command to push the gh_pages folder to gh-pages.');
    console.log('git subtree push --prefix example/gh_pages origin gh-pages');
    gulp.src(path2csWeb + 'example/public/images/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/images/'));

    gulp.src(path2csWeb + 'example/public/bower_components/angular-utils-pagination/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/bower_components/angular-utils-pagination/'));

    gulp.src(path2csWeb + 'csComp/includes/images/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/cs/images/'));

    gulp.src('public/data/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/data/'));

    gulp.src(path2csWeb + 'example/public/cs/css/ROsanswebtextregular.ttf')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/css/'));

    gulp.src(path2csWeb + 'example/public/cs/js/cesium.js')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/cs/js/'));

    gulp.src(path2csWeb + 'example/public/bower_components/Font-Awesome/fonts/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/fonts/'));

    var assets = useref.assets();

    return gulp.src(path2csWeb + 'example/public/*.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(path2csWeb + 'example/gh_pages/'));
});

gulp.task('create_dist', function() {
    gulp.src(path2csWeb + 'example/public/images/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/images/'));

    gulp.src(path2csWeb + 'example/public/bower_components/angular-utils-pagination/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/bower_components/angular-utils-pagination/'));

    gulp.src(path2csWeb + 'csComp/includes/images/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/cs/images/'));

    gulp.src(path2csWeb + 'example/public/data/**/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/data/'));

    gulp.src(path2csWeb + 'example/public/cs/css/ROsanswebtextregular.ttf')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/css/'));

    gulp.src(path2csWeb + 'example/public/cs/js/cesium.js')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/cs/js/'));

    gulp.src(path2csWeb + 'example/public/bower_components/Font-Awesome/fonts/*.*')
        .pipe(plumber())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/fonts/'));

    var assets = useref.assets();

    return gulp.src(path2csWeb + 'example/public/*.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/'));
});

gulp.task('create_dist_of_server', function() {
    gulp.src(path2csWeb + 'example/node_modules/express/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/express/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/express/'));
    gulp.src(path2csWeb + 'example/node_modules/body-parser/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/body-parser/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/body-parser/'));
    gulp.src(path2csWeb + 'example/node_modules/serve-favicon/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/serve-favicon/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/serve-favicon/'));
    gulp.src(path2csWeb + 'example/node_modules/proj4/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/proj4/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/proj4/'));
    gulp.src(path2csWeb + 'example/node_modules/socket.io/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/socket.io/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/socket.io/'));
    gulp.src(path2csWeb + 'example/node_modules/chokidar/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/chokidar/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/chokidar/'));
    gulp.src(path2csWeb + 'example/node_modules/pg/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/pg/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/pg/'));
    gulp.src(path2csWeb + 'example/node_modules/winston/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/winston/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/winston/'));
    gulp.src(path2csWeb + 'example/node_modules/sqlite3/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/sqlite3/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/sqlite3/'));
    gulp.src(path2csWeb + 'example/node_modules/async/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/async/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/async/'));
    gulp.src(path2csWeb + 'example/node_modules/ws/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/ws/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/ws/'));
    gulp.src(path2csWeb + 'example/node_modules/bcryptjs/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/bcryptjs/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/bcryptjs/'));
    gulp.src(path2csWeb + 'example/node_modules/cors/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/cors/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/cors/'));
    gulp.src(path2csWeb + 'example/node_modules/fs-extra/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/fs-extra/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/fs-extra/'));
    gulp.src(path2csWeb + 'example/node_modules/jwt-simple/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/jwt-simple/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/jwt-simple/'));
    gulp.src(path2csWeb + 'example/node_modules/request/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/request/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/request/'));
    gulp.src(path2csWeb + 'example/node_modules/underscore/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/node_modules/underscore/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/node_modules/underscore/'));
    gulp.src(path2csWeb + 'example/ServerComponents/**/*.*')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/ServerComponents/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/ServerComponents/'));
    gulp.src(path2csWeb + 'example/server.js')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/'));
    gulp.src(path2csWeb + 'example/configuration.json')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/'));
    gulp.src(path2csWeb + 'example/public/favicon.ico')
        .pipe(plumber())
        .pipe(changed(path2csWeb + 'example/dist/public/'))
        .pipe(gulp.dest(path2csWeb + 'example/dist/public/'));
});

gulp.task('create_dist_of_client_and_server', ['create_dist', 'create_dist_of_server']);

gulp.task('minify_csComp', function() {
    // gulp.src(path2csWeb + 'csComp/dist-bower.js')
    //    .pipe(plumber())
    //    .pipe(gulp.dest('public/js/cs'));
    gulp.src(path2csWeb + 'example/public/js/cs/csComp.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(path2csWeb + 'example/public/cs/js'));
});

gulp.task('include_js', function() {
    gulp.src(path2csWeb + 'csComp/includes/js/**/*.*')
        // .pipe(debug({
        //     title: 'include_js:'
        // }))
        .pipe(plumber())
        //.pipe(changed('./public/cs/js/'))
        .pipe(gulp.dest(path2csWeb + 'example/public/cs/js'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower/js'));
});

gulp.task('include_css', function() {
    gulp.src(path2csWeb + 'csComp/includes/css/*.*')
        .pipe(plumber())
        //.pipe(changed('./public/cs/css/'))
        .pipe(gulp.dest(path2csWeb + 'example/public/cs/css'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower/css'));
});

gulp.task('include_images', function() {
    gulp.src(path2csWeb + 'csComp/includes/images/**/*.*')
        .pipe(plumber())
        //.pipe(changed('./public/cs/images/'))
        .pipe(gulp.dest(path2csWeb + 'example/public/cs/images/'))
        .pipe(gulp.dest(path2csWeb + 'dist-bower/images'));
});

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

gulp.task('deploy', ['create_dist', 'deploy-githubpages']);

gulp.task('default', ['all', 'watch']);
