//init
const fs = require('fs'),
pkg = require('./package'),
colors = require('colors/safe'),
cl = console.log;

var nodemon = require('nodemon');

nodemon({
  script: './admin/server/admin.js',
  ext: 'js json mjs'
});

nodemon.on('start', function () {
  fs.writeFileSync('./.tmp/pid/nodemon_pid', process.pid)
  cl([
    colors.brightCyan('[spartan:'+ colors.brightRed('cms') +']'),
    colors.brightGreen('v'+ pkg.version),
    colors.brightMagenta('starting...')
  ].join(' '))
}).on('quit', function () {
  cl([
    colors.brightCyan('[spartan:'+ colors.brightRed('cms') +']'),
    colors.brightRed('terminating...')
  ].join(' '))
  process.exit();
}).on('restart', function (files) {
  cl('App restarted due to: ', files);
});
