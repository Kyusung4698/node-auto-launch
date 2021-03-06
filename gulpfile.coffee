gulp = require 'gulp'
$ = require('gulp-load-plugins')()

sourceDirectory = './src/'
testDirectory = './tests/'
scripts = sourceDirectory + '*.coffee'
tests = testDirectory + '*.coffee'
coffeeLintRules = './node_modules/teamwork-coffeelint-rules/coffeelint.json'

onCoffeelintFailure = (numberOfWarnings, numberOfErrors) =>
    $.util.beep()
    throw new Error """
        CoffeeLint failure; see above.
            Warning count: #{numberOfWarnings}.
            Error count: #{numberOfErrors}.
    """

gulp.task 'compile', =>
    gulp.src(scripts)
        .pipe($.coffeelint(optFile: coffeeLintRules))
        .pipe($.coffeelint.reporter())
        .pipe($.coffeelintThreshold 0, 0, onCoffeelintFailure)
        .pipe($.coffee({bare:true}))
        .pipe(gulp.dest('./dist'))

gulp.task 'test', gulp.series('compile', =>
    gulp.src(tests)
        .pipe $.mocha
            reporter: 'spec'
)

gulp.task 'default', gulp.series('compile')

