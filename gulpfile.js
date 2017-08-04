var gulp = require("gulp"); // importamos la librería gulp
var sass = require("gulp-sass");
var notify = require("gulp-notify");
var browserSync = require("browser-sync").create();
var gulpImport = require("gulp-html-import");
var tap=require("gulp-tap");
var browserify = require("browserify");
var buffer = require("gulp-buffer");
var concat = require('gulp-concat');

// source and distribution folder
var
    source = 'src/',
    dest = 'dist/';

// Bootstrap scss source
var bootstrapSass = {
        in: './node_modules/bootstrap-sass/'
    };

// Bootstrap fonts source
var fonts = {
        in: [source + 'fonts/*.*', bootstrapSass.in + 'assets/fonts/**/*'],
        out: dest + 'fonts/'
    };

// Our scss source folder: .scss files
var scss = {
    in: source + 'scss/main.scss',
    out: dest + 'css/',
    watch: source + 'scss/**/*',
    sassOpts: {
        outputStyle: 'nested',
        precison: 3,
        errLogToConsole: true,
        includePaths: [bootstrapSass.in + 'assets/stylesheets']
    }
};


// definimos la tarea por defecto
gulp.task("default",["html","sass","js"], function(){

    //inciamos el servidor de desarrollo:
    browserSync.init({server:'dist/'});

    // observa cambios en los archivos SASS, y entonces ejecuta la tarea 'sass'
    gulp.watch(["./src/scss/*.scss", "./src/scss/**/*.scss"], ["sass"]);

    //observamos también los cambios en html y recarga el navegador.
    gulp.watch(["src/*.html", "src/**/*.html"], ["html"]);

    //observa cambios en archivos js y ejecuta de nuevo la tarea js:
    gulp.watch(["src/js/*.js","src/js/**/*.js"],["js"]);
});

//tareas de bootstrap-sass:
  // copy bootstrap required fonts to dest
gulp.task('fonts', function () {
    return gulp
        .src(fonts.in)
        .pipe(gulp.dest(fonts.out));
});

// compilar sass
gulp.task("sass",['fonts'], function(){
    gulp.src("src/scss/style.scss") // cargamos el archivo style.scss
        .pipe(sass().on("error", function(){
          // lo compilamos con gulp-sass
          return notify().write(error);//si ocurre un error, mostramos la notificación.
        }))
        .pipe(gulp.dest("dist/")) // guardamos el resultado en la carpeta css
        return gulp.src(scss.in) //esta es la de bootstrap-sass
            .pipe(sass(scss.sassOpts))
            .pipe(gulp.dest(scss.out))
        .pipe(browserSync.stream())
        //.pipe(notify("SASS Compilado 💪🏼")); //muestra notificación en pantalla.
});

//copiar e importar html:
gulp.task("html",function(){
  gulp.src("src/*.html")
    .pipe(gulpImport("src/components/"))//ojo con la barra final, que debe ser imprescindible por ser una carpeta.
    .pipe(gulp.dest("dist/"))
    .pipe(browserSync.stream())
    .pipe(notify("HTML importado"));
});

// concatena las librerias externas y las propias en un solo js
gulp.task("concat-js", function(){
    return gulp.src([
                    "./src/js/*.js",
                    "node_modules/bootstrap-sass/assets/javascripts/bootstrap.js",
                    "node_modules/jquery/dist/jquery.js"
                ])
               .pipe(concat('concat.js'))
               .pipe(gulp.dest('./src/js/concat/'));
});

//compilar y generar un único js
gulp.task("js",["concat-js"],function(){
    gulp.src(["src/js/*.js","src/js/**/*.js"])
        .pipe(tap(function(file){ // tap nos permite ejecutar una función por cada fichero seleccionado en gulp.src
            // reemplazamos el contenido del fichero por lo que nos devuelve browserify pasándole el fichero
            file.contents = browserify(file.path, {debug: true}) // creamos una instancia de browserify en base al archivo
                            .transform("babelify", {presets: ["es2015"]}) // traduce nuestro codigo de ES6 -> ES5
                            .bundle() // compilamos el archivo
                            .on("error", function(error){ // en caso de error, mostramos una notificación
                                return notify().write(error);
                            });
        }))
        .pipe(buffer()) // convertimos a buffer para que funcione el siguiente pipe
        //.pipe(sourcemaps.init({loadMaps: true})) // captura los sourcemaps del archivo fuente
        //.pipe(uglify()) // minificamos el JavaScript
        //.pipe(sourcemaps.write('./')) // guarda los sourcemaps en el mismo directorio que el archivo fuente
        .pipe(gulp.dest("dist/")) // lo guardamos en la carpeta dist
        .pipe(browserSync.stream()) // recargamos el navegador
        .pipe(notify("JS Compilado"));
});
