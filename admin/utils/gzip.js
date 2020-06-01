const zlib = require('zlib'),
config = require('../config/gzip_cnf'),
tar = require('tar'),
fs = require('fs');

require('./globals')

const gz = {
  zip: function(url, cb){
    try {
      const i = zlib.createGzip(config),
      inp = fs.createReadStream(url),
      out = fs.createWriteStream(url + '.gz');
      inp.pipe(i).pipe(out);
      return cb(false)
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  unzip: function(url, cb){
    try {
      const i = zlib.createUnzip(config),
      inp = fs.createReadStream(url + '.gz'),
      out = fs.createWriteStream(url);
      inp.pipe(i).pipe(out);
      return cb(false)
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  unzipDat: function(url, cb){
    try {
      url = Buffer.from(fs.readFileSync(url));
      zlib.unzip(url, function (err, res) {
         if (err){ return cb(err, null)}
          cb(false, res.toString());
      })
    } catch (err) {
      if(err){cb(err, null)}
    }
  }
}

// gz.unzip('./test.js')
// gz.gzip('./test.js')

module.exports = gz;
