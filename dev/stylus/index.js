const stylus = require('stylus'),
colors = require('colors'),
fs = require('fs-extra'),
chokidar = require('chokidar'),
config = require('./config');

let cms_dir = process.cwd().split('/').slice(0, -1);
cms_dir = cms_dir.join('/');

const styl = {
  log_console: function(a,b){
    cl([
      colors.brightCyan('[spartan:'+ colors.brightYellow('stylus') +']'),
      colors[a[0]](a[1]),
      colors[b[0]](b[1])
    ].join(' '))
  },
  log_file: function(txt){
    let str = [Buffer.from(txt).toString('base64'), Date.now()].join(':')+ '|';
    fs.appendFile(cms_dir +'/store/logs/stylus', str, function(err){
      if(err){return ce(err)};
    });
  },
  watch: function(){

    const watcher = chokidar.watch(config.files, config.config);

    watcher.on('ready', function(err){
      styl.log_console(
        ['brightGreen', 'starting'],
        ['brightGreen', 'monitor...']
      )
    })
    .on('change', function(path){

      styl.log_console(
        ['brightGreen', 'watching dir'],
        ['brightMagenta', [__dirname, config.mode].join('/')]
      )

      fs.readFile([__dirname, config.mode, config.base_styl].join('/'), 'utf8', function(err, res){
        if(err){
          styl.log_file(js(err));
          return ce(err);
        }
        styl.log_console(
          ['brightMagenta', 'Change detected in file '+ path +'.'],
          ['brightCyan', 'recompiling...']
        )
        stylus.render(res, {compress: config.compress , filename: config.file_name }, function(err, css){
          if(err){
            styl.log_file(js(err));
            return ce(err);
          }

          fs.writeFile([cms_dir, config.dest[config.mode]].join('/'), css,function(err){
            if(err){
              styl.log_file(js(err));
              return cl(err);
            }
            styl.log_console(
              ['brightMagenta', config.file_name +' compile'],
              ['brightGreen', 'success']
            )
          })

        })
      })

    })
    .on('error', function(err){
      styl.log_file(js(err));
      return cl(err);
    })
  }
}

module.exports = styl;
