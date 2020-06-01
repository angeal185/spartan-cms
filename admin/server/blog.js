require('../utils/globals');

const https = require('https'),
express = require('express'),
config = require('../config'),
openssl_cnf = require('../config/openssl_cnf'),
bodyParser = require('body-parser'),
fs = require('fs'),
colors = require('colors/safe'),
blog = express();


blog.use(bodyParser.json());
blog.set('views', 'blog')
blog.set('x-powered-by', false);
blog.use(express.static('blog'));

let server_cfg = Object.assign({}, config.server);

server_cfg.key = fs.readFileSync(base_dir + openssl_cnf.admin.key.file)
server_cfg.cert = fs.readFileSync(base_dir + openssl_cnf.admin.cert.file)

let server = https.createServer(server_cfg, blog);
dest_url = new URL('https://' + config.base_url);
dest_url.port = config.port;

blog.get('/', function (req, res) {
  res.render('index', {
    title: 'login',
    data: config
  })
})

server.listen(config.appport, function(){

  fs.writeFile('.tmp/pid/blog_pid', JSON.stringify(process.pid), function(err){
    if(err){return cl('cannot update blog pid')}
    cl([
      colors.brightCyan('[spartan:'+ colors.brightRed('blog') +']'),
      colors.brightGreen('listening at'),
      colors.brightMagenta(dest_url.origin)
    ].join(' '))
  })
})
