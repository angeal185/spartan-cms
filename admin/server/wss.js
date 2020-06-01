require('../utils/globals');

const https = require('https'),
WebSocket = require('ws'),
ncache = require('../utils/ncache'),
utils = require('../utils'),
cookie = require('cookie'),
os = require('os'),
config = require('../config'),
fs = require('fs-extra'),
db = require('../utils/db'),
enc = require('../utils/enc'),
logs = require('../utils/logs'),
output_min = require('../utils/minify'),
markdown = require( "markdown" ).markdown,
mincnf = require('../config/mincnf'),
minify = require('html-minifier').minify,
CleanCSS = require('clean-css'),
UglifyJS = require("uglify-es"),
tar = require('../utils/tar'),
archive = require('../utils/archive'),
openssl_cnf = require('../config/openssl_cnf'),
min_css_cnf = require('../config/mincss'),
min_js_cnf = require('../config/minjs'),
rest_cnf = require(rest_dir + '/app/config'),
safe_cnf = require('../safe/safe_cnf.json'),
sec_cnf = require('../config/sec_cnf.json'),
colors = require('colors/safe'),
openssl = require('../utils/openssl');

let server_cfg = utils.clone(config.server);
server_cfg.key = fs.readFileSync(base_dir + openssl_cnf.admin.key.file);
server_cfg.cert = fs.readFileSync(base_dir + openssl_cnf.admin.cert.file);

const wss_server = https.createServer(server_cfg),
wss = new WebSocket.Server({server: wss_server}),
dest_url = new URL('wss://' + config.base_url);
dest_url.port = config.wsport;

wss.on('connection', function connection(ws,req) {
  const ip = req.connection.remoteAddress;

    cl([
      colors.brightCyan('[client:'+ colors.brightRed('wss') +']'),
      colors.brightGreen('connected to port:'),
      colors.brightMagenta(config.wsport)
    ].join(' '))

    ws.on('close', function close() {
      cl([
        colors.brightCyan('[client:'+ colors.brightRed('wss') +']'),
        colors.brightRed('disconnected from port:'),
        colors.brightMagenta(config.wsport)
      ].join(' '))
    });

    ws.on('message', function incoming(res) {
      res = jp(res);

      if(res.type === 'login'){
        let data = jp(enc.b64_dec(res.data));
        enc.verify_password({user: data.username, password: data.password, ip: ip}, function(err, result){
          if(err){return cl(err)};
          if(result.code){
            return  ws.send(js({type: 'login', data: result}))
          }
          return ws.send(js({type: 'login', data: result}))
        })

      } else {
        enc.jwt_check(res.jwt, function(err, result){
          if(err){return cl(err)};
          if(result.code){
            cl([
              colors.brightCyan('[client:'+ colors.brightRed('wss') +']'),
              colors.brightRed('invalid token'),
              colors.brightMagenta(config.wsport)
            ].join(' '))
            return  ws.send(js({type: 'login', msg: result.msg, code: 1}))
          }


          if(res.type === 'ld_update'){
            fs.writeFile('./admin/config/jsonld_cnf.json', js(res.data,0,2), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update json-ld'}))}
              return ws.send(js({type: 'msg', data: 'json-ld updated', reload: true}))
            })
          }

          //shortcuts
          if(res.type === 'update_shortcuts'){
            config.shortcut = res.data;
            fs.writeFile('./admin/config/index.json', js(config ,0,2), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update shortcuts'}))}
              return ws.send(js({type: 'msg', data: 'shortcuts config updated', reload: true}))
            })
          }


          // online status check
          if(res.type === 'online_status'){
            let obj = {},
            burl = 'https://' + config.base_url + ':';
            utils.head(config.rest_publish_url, function(rcode){
              obj.rest = (rcode === 200)
              utils.head(config.blog_publish_url, function(rcode){
                obj.blog = (rcode === 200)
                utils.head(burl + config.appport, function(rcode){
                  obj.blog_dev = (rcode === 200)
                  utils.head(burl + config.restport, function(rcode){
                    obj.rest_dev = (rcode === 200)
                    utils.head(burl + config.mobileport, function(rcode){
                      obj.mobile_dev = (rcode === 200)
                      utils.head(burl + config.monitorport, function(rcode){
                        obj.monitor_dev = (rcode === 200)
                        cl(obj)
                        return ws.send(js({type: 'online_status', data: obj}))
                      })
                    })
                  })
                })
              })
            })
          }

          if(res.type === 'restblacklist_list'){
            db.get('rest_blacklist',function(err, data){
              if(err || typeof data !== 'object'){data = [];}
              return ws.send(js({type: 'restblacklist_list', data: data}))
            })
          }

          if(res.type === 'restblacklist_save'){
            fs.writeJson('./store/blacklist/'+ res.data.query +'.json', res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to save ip details'}))}
              return ws.send(js({type: 'msg', data: 'ip details saved in store'}))
            })
          }

          if(res.type === 'restblacklist_backup'){
            archive.stream({dest: './store/backup/blacklist.json', data: js(res.data)}, function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to backup blacklist'}))}
              return ws.send(js({type: 'msg', data: 'blacklist backup saved in store'}))
            })
          }

          if(res.type === 'restblacklist_update'){
            db.put('rest_blacklist', res.data,function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update blacklist'}))}
              return ws.send(js({type: 'msg', data: 'blacklist update success', reload: true}))
            })
          }

          if(res.type === 'contact_list'){
            db.get('contact',function(err, data){
              if(err || typeof data !== 'object'){data = [];}
              return ws.send(js({type: 'contact_list', data: data}))
            })
          }

          if(res.type === 'contact_update'){
            db.put('contact', res.data,function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update messages'}))}
              return ws.send(js({type: 'msg', data: 'messages update success', reload: true}))
            })
          }

          if(res.type === 'subscribers_list'){
            db.get('subscribers',function(err, data){
              if(err || typeof data !== 'object'){data = [];}
              return ws.send(js({type: 'subscribers_list', data: data}))
            })
          }

          if(res.type === 'subscribers_update'){
            db.put('subscribers', res.data,function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update subscribers'}))}
              let src = rest_cnf.unsubscribed.git_url;
              utils.fetch(src, function(err, data){
                if(err){return ws.send(js({error: true, msg: 'unable to sync unsubscribers'}))}
                db.put('unsubscribers', data,function(err){
                  if(err){return ws.send(js({type: 'msg', data: 'unable to update unsubscribers'}))}
                  return ws.send(js({type: 'msg', data: 'subscribers update success', reload: true}))
                })
              })
            })
          }


          if(res.type === 'subscribers_backup'){
            archive.stream({dest: './store/backup/subscribers.json', data: js(res.data)}, function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to backup subscribers'}))}
              return ws.send(js({type: 'msg', data: 'subscribers backup saved in store'}))
            })
          }

          // api data
          if(res.type === 'update_api_data'){
            fs.writeFile('./blog/app/config/api.json', js(res.data), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update api config'}))}
              return ws.send(js({type: 'msg', data: 'api config updated'}))
            })
          }

          // sitemap events
          if(res.type === 'update_sitemap'){
            fs.writeFile('./admin/config/sitemap_cnf.json', js(res.data), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update sitemap config'}))}
              return ws.send(js({type: 'msg', data: 'sitemap config updated', reload: true}))
            })
          }

          if(res.type === 'build_sitemap_index'){
            fs.writeFile('./admin/config/sitemap_cnf.json', js(res.data), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update sitemap config'}))}
              utils.build_sitemap_index(res.data.index, config.blog_publish_url, function(err){
                if(err){return ws.send(js({type: 'msg', data: 'unable to build sitemap index'}))}
                return ws.send(js({type: 'msg', data: 'sitemap index build complete', reload: true}))
              })
            })
          }

          if(res.type === 'build_sitemap_base'){
            fs.writeFile('./admin/config/sitemap_cnf.json', js(res.data), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update sitemap config'}))}
              utils.build_sitemap(res.data.base, config.blog_publish_url, '/sitemap/base.xml',function(err){
                if(err){return ws.send(js({type: 'msg', data: err}))}
                return ws.send(js({type: 'msg', data: 'sitemap base build complete', reload: true}))
              })
            })
          }

          // authors events
          if(res.type === 'author_update'){
            fs.writeFile('./blog/api/data/search/author/index.json', js(res.data), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update author data'}))}
              return ws.send(js({type: 'msg', data: 'author config updated', reload: true}))
            })
          }

          // rss/atom events
          if(res.type === 'rss_atom_cnf_update'){
            fs.writeFile('./admin/config/rss_atom_cnf.json', js(res.data, 0, 2), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update rss_atom config'}))}
              return ws.send(js({type: 'msg', data: 'rss_atom config updated'}))
            })
          }

          //sec events

          if(res.type === 'ssl_cert_gen'){
            openssl.cert_gen(res.obj, function(err, res){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              return ws.send(js({type: 'msg', data: res}))
            })
          }

          if(res.type === 'rsa_oaep_gen'){
            fs.readJson(rest_dir + '/app/config/cert.json', function(err, rest_data){
              if(err){return ws.send(js({type: 'msg', data: 'unable to access rest rsa_oaep '+ [res.dest] +' data'}))}
              fs.readJson('./blog/app/config/cert.json', function(err, blog_data){
                if(err){return ws.send(js({type: 'msg', data: 'unable to access blog rsa_oaep '+ [res.dest] +' data'}))}
                rest_data.RSA_OAEP[res.dest] = res.keypair.private;
                blog_data.RSA_OAEP[res.dest] = res.keypair.public;
                sec_cnf.RSA_OAEP[res.dest] = res.keypair.private;
                fs.writeJson(rest_dir + '/app/config/cert.json', rest_data, function(err){
                  if(err){return ws.send(js({type: 'msg', data: 'unable to save rest rsa_oaep '+ [res.dest] +' data'}))}
                  fs.writeJson('./blog/app/config/cert.json', blog_data, function(err){
                    if(err){return ws.send(js({type: 'msg', data: 'unable to save rest rsa_oaep '+ [res.dest] +' data'}))}
                    fs.writeJson('./admin/config/sec_cnf.json', sec_cnf, function(err){
                      if(err){return ws.send(js({type: 'msg', data: 'unable to save rsa_oaep '+ [res.dest] +' data'}))}
                      ws.send(js({type: 'msg', data: 'rsa_oaep '+ [res.dest] +' data saved'}))
                    })
                  })
                })
              })
            })
          }

          if(res.type === 'user_password_update'){

            enc.update_password(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'logout', data: 'password updated'}))
            })
          }

          if(res.type === 'user_name_update'){

            enc.update_user(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'logout', data: 'username updated'}))
            })
          }

          //gallery events
          if(res.type === 'gallery_list'){
            db.get_gallery(function(err, data){
              if(err){
                return ws.send(js({type: 'msg', data: 'unable to fetch images'}))
              }
              return ws.send(js({type: 'gallery_list', data: data}))
            })
          }

          if(res.type === 'gallery_update'){
            db.set_gallery(res.data, function(err){
              if(err){
                return ws.send(
                  js({type: 'msg', data: 'Gallery update failed'})
                )
              }
              return ws.send(
                js({type: 'msg', data: 'Gallery update success'})
              )
            })
          }

          if(res.type === 'gallery_add'){
            db.add_gallery(res.data, function(err){
              if(err){
                return ws.send(
                  js({type: 'msg', data: 'Gallery update failed'})
                )
              }
              return ws.send(
                js({type: 'msg', data: 'Gallery update success', reload: true})
              )
            })
          }

          if(res.type === 'gallery_del'){
            db.del_gallery(res.data, function(err){
              if(err){
                return ws.send(
                  js({type: 'msg', data: 'Gallery item delete failed'})
                )
              }
              return ws.send(
                js({type: 'msg', data: 'Gallery item delete success', reload: true})
              )
            })
          }

          //post events
          if(res.type === 'post_list'){

            db.get_posts(function(err, data){
              if(err){
                return ws.send(js({type: 'msg', data: 'unable to fetch posts'}))
              }
              return ws.send(js({type: 'post_list', data: data}))
            })
          }

          if(res.type === 'post_tpl_delete'){
            let file = './admin/public/data/tpl/'+ res.for +'_post.json';
            fs.readFile(file, 'utf8' ,function(err,data){
              if(err){
                return ws.send(
                  js({type: 'msg', data: 'unable to access '+ res.for +' template data'})
                )
              }
              data = jp(data);
              let arr = [];
              for (let i = 0; i < data.length; i++) {
                if(data[i].title !== res.data){
                  arr.push(data[i])
                }
              }
              fs.writeFile(file, js(arr), function(err){
                if(err){
                  return ws.send(
                    js({type: 'msg', data: 'unable to delete '+ res.for +' template data'})
                  )
                }
                return ws.send(
                  js({type: 'msg', data: res.for +' template deleted', reload: true})
                )
              })

            })

          }

          if(res.type === 'post_tpl_save'){
            let file = './admin/public/data/tpl/'+ res.for +'_post.json';
            res.data.title = res.data.title + '_' + Date.now();
            fs.readFile(file, 'utf8' ,function(err,data){
              if(err){
                return ws.send(
                  js({type: 'msg', data: 'unable to access '+ res.for +' template data'})
                )
              }
              data = jp(data);
              data.push(res.data);
              fs.writeFile(file, js(data), function(err){
                if(err){
                  return ws.send(
                    js({type: 'msg', data: 'unable to save '+ res.for +' template data'})
                  )
                }
                return ws.send(
                  js({type: 'msg', data: 'new '+ res.for +' template saved', reload: true})
                )
              })
            })
          }

          if(res.type === 'post_create'){

            res.data.body = minify(res.data.body, mincnf);
            db.create_post(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'msg', data: 'post added to db'}))
            })
          }

          if(res.type === 'post_delete'){

            db.delete_post(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'msg', data: 'post deleted from db', reload: true}))
            })
          }

          if(res.type === 'post_update'){

            res.data.body = minify(res.data.body, mincnf);
            db.update_post(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'msg', data: 'post update saved to db'}))
            })
          }

          if(res.type === 'markdown'){
            let data;
            try {
              data = markdown.toHTML(res.data);
              let obj = {
                type:'markdown',
                data: data,
                dest: res.dest || 'post'
              }
              return ws.send(js(obj))
            } catch (err) {
              if(err){
                return ws.send(js({type:'markdown', data: 'invalid markdown'}))
              }
            }
          }

          //news events

          if(res.type === 'news_list'){

            db.get_news(function(err, data){
              if(err){
                return ws.send(js({type: 'msg', data: 'unable to fetch news items'}))
              }
              return ws.send(js({type: 'news_list', data: data}))
            })
          }

          if(res.type === 'news_create'){

            res.data.body = minify(res.data.body, mincnf);
            db.create_news(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'msg', data: 'news entry added to db'}))
            })
          }

          if(res.type === 'news_update'){

            res.data.body = minify(res.data.body, mincnf);
            db.update_news(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'msg', data: 'news update saved to db'}))
            })
          }

          if(res.type === 'news_delete'){

            db.delete_news(res.data, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: err}))
              }
              return ws.send(js({type: 'msg', data: 'post deleted from db', reload: true}))
            })
          }

          //page events
          if(res.type === 'page_create'){
            db.create_page(res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              ws.send(js({type: 'msg', data: 'new page added'}))
            })

          }

          if(res.type === 'page_edit'){
            db.edit_page(res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              ws.send(js({type: 'msg', data: 'page updated'}))
            })

          }

          if(res.type === 'page_delete'){
            db.delete_page(res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              ws.send(js({type: 'msg', data: 'page deleted from db', reload: true}))
            })

          }

          if(res.type === 'page_list'){

            db.get('pages', function(err, data){
              if(err){return ws.send(js({type: 'msg', data: 'unable to fetch pages'}))}
              return ws.send(js({type: 'page_list', data: data}))
            })
          }

          if(res.type === 'database_get'){
            db.get(res.mode, function(err, data){
              if(err){return ws.send(js({type: 'msg', data: 'unable to fetch database data'}))}
              return ws.send(js({type: 'database_get', data: data, mode: res.mode}))
            })
          }

          if(res.type === 'database_update'){
            db.put(res.mode, res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update database data'}))}
              return ws.send(js({type: 'msg', data: 'database update success'}))
            })
          }

          if(res.type === 'settings_get'){
            fs.readFile(res.mode, 'utf8',function(err, data){
              if(err){return ws.send(js({type: 'msg', data: 'unable to fetch settings data'}))}
              return ws.send(js({type: 'settings_get', data: jp(data), mode: res.mode}))
            })
          }

          if(res.type === 'settings_update'){
            fs.writeFile(res.mode, js(res.data), function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update settings data'}))}
              return ws.send(js({type: 'msg', data: 'settings update success'}))
            })
          }

          if(res.type === 'database_export'){
            let filename = './store/exports/'+ [res.mode, js(Date.now())].join('-');
            fs.writeFile(filename, res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: 'data export failed'}))}
              return ws.send(js({type: 'msg', data: filename +' exported'}))
            })
          }

          if(res.type === 'page_status_update'){

            db.update_page_status(res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              return ws.send(js({type: 'msg', data: 'page status updated', reload: true}))
            })
          }

          if(res.type === 'update_page_order'){
            utils.update_page_order(res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              return ws.send(js({type: 'msg', data: 'page order updated'}))
            })
          }

          if(res.type === 'update_import_order'){

            db.put('imports', res.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: 'unable to update imports'}))}
              db.set_imports(function(err){
                if(err){return ws.send(js({type: 'msg', data: err}))}
                return ws.send(js({type: 'msg', data: 'page imports updated'}))
              })
            })
          }

          if(res.type === 'import_list'){
            db.get_imports(function(res){
              return ws.send(js({type: 'import_list', data: res}))
            })
          }

          if(res.type === 'page_base'){
            db.page_base(function(err,res){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              return ws.send(js({type: 'page_base', data: res}))
            })
          }

          if(res.type === 'page_base_update'){
            db.page_base_update(res.data, minify, mincnf, function(err,res){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              return ws.send(js({type: 'msg', data: 'page data update success'}))
            })
          }

          if(res.type === 'page_base_reset'){
            db.page_base_update(function(err,res){
              if(err){return ws.send(js({type: 'msg', data: err}))}
              return ws.send(js({type: 'msg', data: 'page data reset success', reload: true}))
            })
          }

          if(res.type === 'list_files'){
            utils.list_files(res.data, function(err,res){
              if(err){return ws.send(js({type: 'msg', data: 'no files found'}))}
              return ws.send(js({type: 'list_files', data: res}))
            })
          }

          if(res.type === 'file_get'){
            fs.readFile(res.data, 'utf8', function(err, res){
              if(err){return ws.send(js({type: 'msg', data: 'file load failed'}))}
              return ws.send(js({type: 'file_get', data: res}))
            })
          }

          if(res.type === 'file_update'){
            fs.writeFile(res.data.dest, res.data.data, function(err){
              if(err){return ws.send(js({type: 'msg', data: 'file update failed'}))}
              return ws.send(js({type: 'msg', data: res.data.dest +' updated'}))
            })
          }

          if(res.type === 'feed_data'){
            fs.readFile('./blog/api/feed/index.json', 'utf8', function(err, res){
              if(err){return ws.send(js({type: 'msg', data: 'feed config error'}))}
              return ws.send(js({type: 'feed_data', data: jp(res)}));
            })
          }

          if(res.type === 'feed_timespan'){
            let data = res.data;
            fs.readFile('./blog/api/feed/index.json', 'utf8', function(err, res){
              if(err){return ws.send(js({type: 'msg', data: 'feed config error'}))}
              res = jp(res);
              res.update_timespan[data.type] = data.val;
              fs.writeFile('./blog/api/feed/index.json', js(res), function(err){
                if(err){return ws.send(js({type: 'msg', data: 'feed config update error'}))}
                return ws.send(js({type: 'msg', data: data.type +' timespan updated', reload:true}))
              })
            })
          }

          if(res.type === 'feed_types'){
            let data = res.data;
            fs.readFile('./blog/api/feed/index.json', 'utf8', function(err, res){
              if(err){return ws.send(js({type: 'msg', data: 'feed config error'}))}
              res = jp(res);
              res.types = data;
              fs.writeFile('./blog/api/feed/index.json', js(res,0,2), function(err){
                if(err){return ws.send(js({type: 'msg', data: 'feed config update error'}))}
                return ws.send(js({type: 'msg', data: 'feed types updated'}))
              })
            })
          }

          if(res.type === 'feed_compression'){
            let data = res.data;
            fs.readFile('./blog/api/feed/index.json', 'utf8', function(err, res){
              if(err){return ws.send(js({type: 'msg', data: 'feed config error'}))}
              res = jp(res);
              res.compression = data;
              fs.writeFile('./blog/api/feed/index.json', js(res,0,2), function(err){
                if(err){return ws.send(js({type: 'msg', data: 'feed config update error'}))}
                return ws.send(js({type: 'msg', data: 'feed compression updated'}))
              })
            })
          }

          if(res.type === 'feed_update'){
            let data = res.data;
            db['dump_post_'+ data.ext](data.type ,function(err){
              if(err){return ws.send(js({type: 'msg', data: data.ext +' feed update error'}))}
              return ws.send(js({type: 'msg', data: data.ext +' feed updated', reload:true}))
            })
          }

          if(res.type === 'safe_update'){
            let data = res.data;

            enc.lock_safe(data.password, data.data, data.type, function(err){
              if(err){
                cl(err)
                return ws.send(js({type: 'msg', data: 'unable to update '+ data.type +' safe'}))
              }
              return ws.send(js({type: 'msg', data: data.type +' safe updated'}))
            })

          }

          if(res.type === 'safe_unlock'){
            let data = res.data;

            enc.unlock_safe(data.password, data.type, function(err,res){
              if(err){if(err){return ws.send(js({type: 'msg', data: 'unable to unlock safe'}))}}
              return ws.send(js({
                type: 'safe_unlock',
                data: {
                  data: res,
                  type: data.type
                }
              }))
            })
          }

          if(res.type === 'safe_add'){
            let data = res.data;
            enc.lock_safe(data.password, safe_cnf.template, data.type, function(err){
              if(err){
                return ws.send(js({type: 'msg', data: 'unable to create '+ data.type +' safe'}))
              }
              fs.readFile('./admin/safe/safe_cnf.json', 'utf8', function(err, res){
                if(err){return ws.send(js({type: 'msg', data: 'unable to access safe config'}))}
                res = jp(res);
                res.items.push(data.type);
                fs.writeFile('./admin/safe/safe_cnf.json', js(res), function(err){
                  if(err){return ws.send(js({type: 'msg', data: 'unable to update safe config'}))}
                  ws.send(js({type: 'msg', data: data.type +' safe created'}))
                  return ws.send(js({type: 'safe_edit', data: {type: 'add', title: data.type}}));
                })
              })
            })

          }

          if(res.type === 'safe_delete'){
            let data = res.data;

            fs.readJson(sec_cnf.keyfile, 'utf8', function(err, key_data){
              if(err){return ws.send(js({type: 'msg', data: 'unable to access safe keyfile'}))}

              fs.readJson('./admin/safe/safe_cnf.json', 'utf8', function(err, res){
                if(err){return ws.send(js({type: 'msg', data: 'unable to access safe config'}))}
                let arr = [];
                for (let i = 0; i < res.items.length; i++) {
                  if(res.items[i] !== data){
                    arr.push(res.items[i])
                  }
                }
                res.items = arr;
                fs.writeJson('./admin/safe/safe_cnf.json', res, function(err){
                  if(err){return ws.send(js({type: 'msg', data: 'unable to update safe config'}))}
                  fs.unlink('./admin/safe/'+ data, function(err){
                    if(err){return ws.send(js({type: 'msg', data: 'unable to delete safe '+ data}))}
                    delete key_data[data];
                    fs.writeJson(sec_cnf.keyfile, key_data, function(err){
                      if(err){return ws.send(js({type: 'msg', data: 'unable to update safe keyfile'}))}
                      ws.send(js({type: 'msg', data: 'safe '+ data +' deleted'}))
                    })

                    return ws.send(js({type: 'safe_edit', data: {type: 'delete', title: data}}));
                  })
                })
              })
            })

          }

          if(res.type === 'min_css'){
            let data = new CleanCSS(min_css_cnf).minify(res.data);
            if(data.warnings.length === 0 && data.errors.length === 0){
              data = data.styles;
            } else {
              data = null;
            }
            return ws.send(js({
              type: res.type,
              data: data
            }))
          }

          if(res.type === 'min_js'){
            let data = new UglifyJS.minify(res.data, min_js_cnf);
            if(data.error === undefined){
              data = data.code;
            } else {
              data = null;
            }
            return ws.send(js({
              type: res.type,
              data: data
            }))
          }

          if(res.type === 'dashboard'){
            let arr = ['posts', 'news', 'pages', 'blacklist', 'subscribers', 'unsubscribers', 'gallery'],
            author_data = fs.readJsonSync('./blog/api/data/search/author/index.json'),
            obj = {
              author:{},
              tagcat: fs.readJsonSync('./blog/api/data/tagcat.json')
            };

            for (let i = 0; i < author_data.length; i++) {
              obj.author[author_data[i].author] = {
                posts: author_data[i].post_count,
                news: 0
              }
            }

            for (let i = 0; i < arr.length; i++) {
              obj[arr[i]] = {};
              obj[arr[i]].len = 0;
              obj[arr[i]].size = 0;
            }

            db.get('posts', function(err,data){
              if(!err){

                obj.posts.len = data.length;
                obj.posts.size = js(data).length;
                obj.posts.post_year = utils.item_count_uint16(data);

              }

              db.get('news', function(err,data){
                if(!err){
                  obj.news.len = data.length;
                  obj.news.size = js(data).length;
                  obj.news.post_year = utils.item_count_uint16(data);

                  for (let i = 0; i < data.length; i++) {
                    obj.author[data[i].author].news++
                  }
                  cl(obj.author)

                }
              db.get('pages', function(err,data){
                if(!err){
                  obj.pages.len = data.length;
                  obj.pages.size = js(data).length;
                }
                db.get('last_login', function(err, data){
                  if(err){
                    obj.last_login = Date.now();
                  } else {
                    obj.last_login = data || Date.now();
                  }
                  db.get('total_login', function(err, data){
                    if(err){
                      obj.total_login = 'null';
                    } else {
                      obj.total_login = data;
                    }
                    db.get('login_attempts', function(err, data){
                      if(err){
                        obj.login_attempts = 'null';
                      } else {
                        obj.login_attempts = data.length;
                      }
                      db.get('rest_blacklist', function(err, data){
                        if(!err){
                          obj.blacklist.len = data.length;
                          obj.blacklist.size = js(data).length;
                        }
                        db.get('subscribers', function(err, data){
                          if(!err){
                            obj.subscribers.len = data.length;
                            obj.subscribers.size = js(data).length;
                          }
                          db.get('unsubscribers', function(err, data){
                            if(!err){
                              obj.unsubscribers.len = data.length;
                              obj.unsubscribers.size = js(data).length;
                            }
                            db.get('gallery', function(err, data){
                              if(!err){
                                obj.gallery.len = data.length;
                                obj.gallery.size = js(data).length;
                              }
                              return ws.send(js({
                                type: res.type,
                                data: obj
                              }))
                            })
                          })
                        })
                      })
                    })
                  })
                })

              })
            })
          })

          }

        })
      }

  })

});


wss_server.on('upgrade', function(req, socket, head) {
  if(sec_cnf.spartan_token.active){
    let s_cookie = cookie.parse(req.headers.cookie || '');
    if(!s_cookie.spartan_token || s_cookie.spartan_token !== sec_cnf.spartan_token.token){
      socket.destroy();
      return;
    }
  }
});

wss_server.listen(config.wsport, function(){
  cl([
    colors.brightCyan('[spartan:'+ colors.brightRed('wss') +']'),
    colors.brightGreen('listening at'),
    colors.brightMagenta(dest_url.origin)
  ].join(' '))
})

module.exports = wss_server;
