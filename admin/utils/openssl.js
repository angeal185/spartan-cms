const { spawn } = require('child_process'),
fs = require('fs'),
cnf = require('../config/openssl_cnf'),
cl = console.log,
jp = JSON.parse,
js = JSON.stringify;

const openssl = {
  cert_gen: function(obj, cb){
    const cnf = jp(fs.readFileSync('./admin/config/openssl_cnf.json', 'utf8'));
    let w_dir = rest_dir;
    if(obj.dest === 'admin'){
      w_dir = base_dir;
    }

    key = spawn('openssl',[
      'ecparam','-genkey','-out', obj.key, '-name', cnf[obj.dest].key.curve
    ])

    key.stdout.on('data', function(data){
      cl(data.toString());
    });

    key.stderr.on('data', function(data){
      console.error(data.toString());
    });

    key.on('exit', function(code){
      if(code){ return cb('openssl key error')}
      cl('openssl key generated');

      const cert = spawn('openssl',[
        'req','-x509','-new','-config', w_dir + cnf[obj.dest].cert.config,'-key', obj.key, '-out', obj.cert
      ]);
      cert.stdout.on('data', function(data){
        cl(data.toString());
      });

      cert.stderr.on('data', function(data){
        console.error(data.toString());
      });

      cert.on('exit',function(code){
        if(code){return cb('openssl cert error')}
        cl('openssl cert generated');
        cb(false, 'openssl cert generated')
      });
    });
  }
}


module.exports = openssl;
