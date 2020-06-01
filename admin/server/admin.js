require('../utils/globals')

const https = require('https'),
os = require('os'),
cookie = require('cookie'),
utils = require('../utils'),
express = require('express'),
bodyParser = require('body-parser'),
config = require('../config'),
rout = require('../rout'),
fs = require('fs'),
url = require('url'),
//logs = require('../utils/logs'),
output_min = require('../utils/minify'),
njk = require('nunjucks'),
sec_cnf = require('../config/sec_cnf'),
openssl_cnf = require('../config/openssl_cnf'),
colors = require('colors/safe'),
enc = require('../utils/enc'),
cors = require('cors'),
openssl = require('../utils/openssl');

require('./wss');

/*
openssl.cert_gen(function(err){
  if(err){return cl(err)}
  cl('openssl success')
})
return
*/

let server_cfg = utils.clone(config.server);
server_cfg.key = fs.readFileSync(base_dir + openssl_cnf.admin.key.file);
server_cfg.cert = fs.readFileSync(base_dir + openssl_cnf.admin.cert.file);

var app = express()

app.use(cors())

app.use(bodyParser.json());
if(config.output_min){
  app.use(output_min);
}


//let env = new njk.Environment();

njk.configure('admin/views', {
  express: app,
  autoescape: true
})


app.use(function(req, res, next) {

  if(req.headers['sec-fetch-dest'] === 'script'){
    let public_modules = sec_cnf.public_modules,
    item = req.url.split('/').pop();
    if(public_modules.indexOf(item) === -1){
      let authToken = cookie.parse(req.headers.cookie || '')
      if(authToken[sec_cnf.spartan_cookie.name] === undefined){
        return res.status(404).end()
      }
      enc.sig_check(authToken[sec_cnf.spartan_cookie.name], function(err, data){
        if(err || data.code){return res.status(404).end()}
        next();
      })
    } else {
      next();
    }
  } else {
    next();
  }
});


app.set('view engine', 'njk');
app.set('x-powered-by', false);

app.use(express.static('admin/public'));
app.use(express.static('plugins'));
app.use('/', rout);

const admin_server = https.createServer(server_cfg, app),
dest_url = new URL('https://' + config.base_url);
dest_url.port = config.port;

admin_server.listen(config.port, function(){
  fs.writeFile('.tmp/pid/admin_pid', JSON.stringify(process.pid), function(err){
    if(err){return cl('cannot update admin pid')}
    cl([
      colors.brightCyan('[spartan:'+ colors.brightRed('admin') +']'),
      colors.brightGreen('listening at'),
      colors.brightMagenta(dest_url.origin)
    ].join(' '))
  })
})

module.exports = admin_server;
