const fs = require('fs'),
config = require('../config'),
urls = require('./urls');

const logs = {
  list: function(){
    glob(urls.log, function (err, res) {
      if(err){return cb('unable to access files')}
      cb(false, res)
    })
  },
  add: function(i, cb){
    let dnow = Date.now(),
    log_file = urls.log + 'log';

    i.date = dnow;
    i = Buffer.from(JSON.stringify(i), 'binary').toString('base64') + ':';

    fs.stat(log_file, function(err, res){
      if(err || res.size < config.log_size){
        fs.appendFile(log_file, i, function(err){
          if(err){cb(err)}
          cb(false);
        });
      } else {
        fs.copyFile(log_file, [log_file, dnow].join('_'), function(err){
          if(err){cb(err)}
          fs.writeFile(log_file, i, function(err){
            if(err){cb(err)}
            cb(false);
          })
        });
      }
    });
  },
  del: function(cb){
    let log_file = urls.log + 'log';
    fs.writeFile(log_file, '', function(err){
      if(err){cb(err)}
      cb(false);
    })
  },
  reset: function(cb){
    let log_file = urls.log + 'log';
    logs.del(function(err){
      if(err){cb(err)}
      logs.list(function(err,res){
        if(err){cb(err)};
        for (let i = 0; i < res.length; i++) {
          if(res[i] !== 'log'){
            fs.unlink(res[i], function(err){
              if(err){cb(err)}
              console.log(res[i]+ ' was deleted');
            });
          }
        }

      })
    })
  }
}

module.exports = logs;
