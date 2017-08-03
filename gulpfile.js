var gulp = require("gulp"); // importamos la librería gulp
var sass = require("gulp-sass");
var notify = require("gulp-notify");
var browserSync = require("browser-sync").create();
var gulpImport = require("gulp-html-import");
var tap=require("gulp-tap");
var browserify = require("browserify");
var buffer = require("gulp-buffer");

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

//compilar y generar un único js
gulp.task("js",function(){
  gulp.src("src/js/main.js")
    .pipe(tap(function(file){
      //es decir, reemplazamos el contenido del fichero por lo que broserify nos devuelve al pasarle el fichero
      file.contents=browserify(file.path) //creamos una instancia de broserify en base al archivo que le estamos pasando
                    .transform("babelify",{presets:["es2015"]})//traduce nuestro código de es6 a es5
                    .bundle()//compila el archivo
                    .on("error",function(){ //en caso de error, mostramos una notificación
                      return notify().write(error);
        });
    }))//nos permite ejecutar una función por cada fichero seleccionado en gulp.src
    .pipe(buffer())//convertimos a buffer para que funcione el siguiente pipe
    .pipe(gulp.dest("dist/"))//lo guardamos en la carpeta dist
    .pipe(browserSync.stream()) //recargamos el navegador
    .pipe(notify("JS compilado"));

});
