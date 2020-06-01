let config = require('../config');

const express = require('express'),
ncache = require('../utils/ncache'),
utils = require('../utils'),
cookie = require('cookie'),
fs = require('fs-extra'),
ace_cnf = require('../config/ace_cnf'),
tiny_cnf = require('../config/tiny_cnf'),
sec_cnf = require('../config/sec_cnf'),
ip_cnf = require('../config/ip_cnf'),
openssl_cnf = require('../config/openssl_cnf'),
rest_cnf = require(rest_dir + '/app/config/index'),
urls = require('../utils/urls'),
enc = require('../utils/enc'),
db = require('../utils/db'),
router = express.Router();

const obj = {
  posts: ['create', 'view', 'edit'],
  news: ['create', 'view', 'edit'],
  editor: ['css', 'js', 'mjs', 'json', 'styl', 'scss', 'less'],
  pages: ['create', 'view', 'imports', 'edit', 'base'],
  rest: ['messages', 'subscribers', 'blacklist', 'logs', 'config']
}

router.get('*', function(req, res, next){

  if(req.url !== '/login'){
    let authToken = cookie.parse(req.headers.cookie || '')
    if(authToken[sec_cnf.spartan_cookie.name] === undefined){
      return res.redirect('/login');
    }
    enc.sig_check(authToken[sec_cnf.spartan_cookie.name], function(err, data){
      if(err || data.code){return res.redirect('/login')}
      next()
    })
  } else {
    next()
  }
})

router.post('*', function(req, res, next){

  if(req.originalUrl !== '/login'){
    let authToken = cookie.parse(req.headers.cookie || '')
    if(authToken[sec_cnf.spartan_cookie.name] === undefined){
      return res.json({error: 'access denied'});
    }
    enc.sig_check(authToken[sec_cnf.spartan_cookie.name], function(err, data){
      if(err || data.code){return res.json({error: 'access denied'});}
      next()
    })
  } else {
    next();
  }
})


router.post('/login', function (req, res) {
  let data = req.body;
  db.get_user(function(err,userData){
    if(err){return res.json({code:1, msg: 'error in user data'})}
    let stat = true,
    cday = utils.get_day();

    for (let i in data) {
      if(userData[i] !== data[i]){
        stat = false;
      }
    }
    if(!stat){
      return res.json({code:1, msg: 'error in login data'})
    }

    res.setHeader('Set-Cookie',
      [cookie.serialize(sec_cnf.spartan_cookie.name, enc.hmac(userData.sig, userData.token), {
        httpOnly: true,
        secure: true,
        sameSite: true,
        maxAge: sec_cnf.user.duration / 1000
      }),
      cookie.serialize(rest_cnf.cookie.name, rest_cnf.cookie.items[utils.get_day()], {
        httpOnly: true,
        secure: true,
        domain: rest_cnf.base_url,
        maxAge: sec_cnf.user.duration / 1000
      })]
    );


    return res.json({
      code:0,
      msg: 'login success'
    })

  })

})

router.get('/login', function (req, res) {

  if(sec_cnf.spartan_token.active){
    let s_cookie = cookie.parse(req.headers.cookie || '');
    cl(s_cookie)
    if(s_cookie.spartan_token && s_cookie.spartan_token === sec_cnf.spartan_token.token){
      cl('cookie found')
    } else {
      cl('cookie not found')
      res.end();
      return;
    }
  }

  res.render('login', {
    title: 'login',
    data: config
  })

})

router.get('/online_status', function (req, res) {


})

router.post('/logout', function (req, res) {
  db.get_user(function(err, obj){
    if(err){return res.json({code:1, msg: 'error in user data'})}
    obj = enc.jwt_reset(obj);
    db.set_user(obj, function(err){
      if(err){return res.json({code:1, msg: 'unable to update user data'})}
      res.setHeader('Set-Cookie',
        cookie.serialize('token', 'null', {
          httpOnly: true,
          secure: true,
          sameSite: true,
          maxAge: 1
        })
      );

      return res.json({
        code:0,
        msg: 'logout success'
      })

    })
  })
})

router.post('/access_token', function (req, res) {
  let data = req.body;
  fs.readFile(urls.config + 'sec_cnf.json', 'utf8', function(err, sdata){
    if(err){
      return res.json({
        code:1,
        msg: 'cannot access token data'
      })
    }
    sdata = jp(sdata);
    if(data.current !== sdata.spartan_token.token){
      return res.json({
        code:1,
        msg: 'cannot verify current token'
      })
    }
    delete data.current;

    sdata.spartan_token = data;

    fs.writeFile(urls.config + 'sec_cnf.json', js(sdata,0,2), function(err){
      if(err){
        return res.json({
          code:1,
          msg: 'cannot update token data'
        })
      }
      res.setHeader('Set-Cookie',
        cookie.serialize('spartan_token', sdata.spartan_token.token, {
          httpOnly: true,
          secure: true,
          sameSite: true,
          maxAge: 999999999
        })
      );

      return res.json({
        code:0,
        msg: 'token data update success'
      })

    })

  })

})

router.get('/', function (req, res) {
  config.duration = sec_cnf.user.duration;
  res.render('index', {
    title: 'dashboard',
    data: config
  })
})

router.get('/shortcut', function (req, res) {
  res.render('main', {
    title: 'shortcut',
    data: config
  })
})

for (let i = 0; i < obj.posts.length; i++) {
  router.get('/posts/'+ obj.posts[i] , function (req, res) {
    config.ace = ace_cnf;
    config.tinymce = tiny_cnf;
    res.render('main', {
      title: 'post_'+ obj.posts[i],
      data: config
    })
  })
}

for (let i = 0; i < obj.news.length; i++) {
  router.get('/news/'+ obj.posts[i] , function (req, res) {
    config.ace = ace_cnf;
    config.tinymce = tiny_cnf;
    res.render('main', {
      title: 'news_'+ obj.posts[i],
      data: config
    })
  })
}

for (let i = 0; i < obj.editor.length; i++) {
  router.get('/editor/'+ obj.editor[i] , function (req, res) {
    config.ace = ace_cnf;
    res.render('editor', {
      title: 'editor_'+ obj.editor[i],
      data: config
    })
  })
}

for (let i = 0; i < obj.pages.length; i++) {
  router.get('/pages/'+ obj.pages[i], function (req, res) {
    if(obj.pages[i] === 'view'){
      config.navlinks = jp(fs.readFileSync('./blog/app/config/index.json')).navlinks;
    }
    if(obj.pages[i] === 'base'){
      config.ace = ace_cnf;
      config.jsonld = jp(fs.readFileSync('./admin/config/jsonld_cnf.json'));
    }

    if(obj.pages[i] === 'create' || obj.pages[i] === 'edit'){
      config.ace = ace_cnf;
      config.tinymce = tiny_cnf;
    }

    res.render('main', {
      title: 'pages_'+ obj.pages[i],
      data: config
    })
  })
}

router.get('/database/edit', function (req, res) {
  res.render('main', {
    title: 'database_edit',
    data: config
  })
})

router.get('/settings', function (req, res) {
  config.settings = jp(fs.readFileSync('./admin/urls/settings.json'));
  res.render('main', {
    title: 'settings',
    data: config
  })
})

router.get('/safe', function (req, res) {
  config.settings = jp(fs.readFileSync('./admin/safe/safe_cnf.json'));
  config.keyfile = sec_cnf.keyfile
  res.render('main', {
    title: 'safe',
    data: config
  })
})

router.get('/feed', function (req, res) {
  res.render('main', {
    title: 'feed',
    data: config
  })
})

router.get('/rss_atom', function (req, res) {
  config.rss = jp(fs.readFileSync('./admin/config/rss_atom_cnf.json'));
  res.render('main', {
    title: 'rss_atom',
    data: config
  })
})

router.get('/seo/sitemap', function (req, res) {
  config.sitemap = jp(fs.readFileSync('./admin/config/sitemap_cnf.json'));
  res.render('main', {
    title: 'sitemap',
    data: config
  })
})

router.get('/seo/jsonld', function (req, res) {
  config.jsonld = jp(fs.readFileSync('./admin/config/jsonld_cnf.json'));
  res.render('main', {
    title: 'jsonld',
    data: config
  })
})

router.get('/api', function (req, res) {

  config.api = jp(fs.readFileSync('./blog/app/config/api.json'));
  res.render('main', {
    title: 'api',
    data: config
  })
})

router.get('/authors', function (req, res) {
  config.authors = jp(fs.readFileSync('./blog/api/data/search/author/index.json'));
  res.render('main', {
    title: 'authors',
    data: config
  })
})

router.get('/gallery/items', function (req, res) {
  res.render('main', {
    title: 'gallery_items',
    data: config
  })
})

router.get('/gallery/test', function (req, res) {
  res.render('main', {
    title: 'gallery_test',
    data: config
  })
})

router.get('/security', function (req, res) {
  config.settings = sec_cnf;

  openssl_cnf.rest.cert.file = rest_dir + openssl_cnf.rest.cert.file;
  openssl_cnf.rest.key.file = rest_dir + openssl_cnf.rest.key.file;

  openssl_cnf.admin.cert.file = base_dir + openssl_cnf.admin.cert.file;
  openssl_cnf.admin.key.file = base_dir + openssl_cnf.admin.key.file;

  config.ssl = {
    admin: {
      cert: fs.readFileSync(openssl_cnf.admin.cert.file, 'utf8'),
      key: fs.readFileSync(openssl_cnf.admin.key.file, 'utf8')
    },
    rest: {
      cert: fs.readFileSync(openssl_cnf.rest.cert.file, 'utf8'),
      key: fs.readFileSync(openssl_cnf.rest.key.file, 'utf8')
    }
  };
  config.openssl = openssl_cnf;
  res.render('main', {
    title: 'security',
    data: config
  })
})

router.get('/plugins/admin', function (req, res) {
  let ppath = './plugins/',
  available = fs.readdirSync(ppath + 'admin'),
  newarr = [],
  finalarr = [],
  obj = {
    available: []
  }, item;

  for (let i = 0; i < available.length; i++) {
    if(newarr.indexOf(available[i]) === -1){
      finalarr.push(available[i])
    }
  }

  newarr = null;

  for (let i = 0; i < finalarr.length; i++) {
    item = jp(fs.readFileSync(ppath + 'admin/' + finalarr[i] + '/package.json'))
    obj.available.push({
      name: item.name,
      description: item.description,
      author: item.author,
      version: item.version,
      homepage: item.homepage,
      ico_url: item.ico_url
    })
  }

  config.plugin_data = obj;
  res.render('main', {
    title: 'plugins_admin',
    data: config
  })
})



router.get('/plugins/admin/:id', function (req, res) {

  cl(req.params.id)
  config.plugin_data = obj;
  res.render('plugins', {
    title: req.params.id,
    ptype: 'admin',
    data: config
  })

})

router.post('/plugins/admin/:id', function (req, res) {
  const id = req.params.id,
  plugin_utils = require('../../plugins/admin/'+ id),
  body = req.body;

  function err_handle(err, data){
    let obj = {
      success: true
    };
    if(err){
      obj.success = false;
      obj.data = err;
      return res.json(obj);
    }
    obj.data = data;
    return res.json(obj);
  }

  if(body.data){
    plugin_utils[body.fn](body.data, function(err, data){
      err_handle(err, data);
    })
  } else {
    plugin_utils[body.fn](function(err, data){
      err_handle(err, data);
    })
  }

})

router.get('/rest/subscribers', function (req, res) {
  config.privateKey = sec_cnf.RSA_OAEP.subscribe;
  res.render('main', {
    title: 'rest_subscribers',
    data: config
  })
})

router.get('/rest/messages', function (req, res) {
  config.privateKey = sec_cnf.RSA_OAEP.contact
  res.render('main', {
    title: 'rest_messages',
    data: config
  })
})

router.get('/rest/blacklist', function (req, res) {
  config.trace_url = ip_cnf.trace_url
  res.render('main', {
    title: 'rest_blacklist',
    data: config
  })
})


router.get('/rest/hitcount', function (req, res) {
  res.render('main', {
    title: 'rest_hitcount',
    data: config
  })
})

router.get('/rest/logs', function (req, res) {
  res.render('main', {
    title: 'rest_logs',
    data: config
  })
})

router.get('/rest/config', function (req, res) {
  res.render('main', {
    title: 'rest_config',
    data: config
  })
})

router.post('/post_rest', function (req, res) {
  let body = req.body;

  utils.secure_post({dest: body.dest, data: body.data, path: rest_cnf.admin_config.base_url}, function(err,post_res){
    if(err){return cl(err)}
    post_res = jp(post_res)
    cl(post_res)

    if(body.dest === 'contact'){

      if(!post_res.success){
        return res.end(js({success: false, msg: post_res.msg}))
      }
      let arr = [];

      if(body.data.action === 'reset'){
        db.put('contact', arr, function(err){
          if(err){
            return res.end(js({success: false, msg: 'unable to update contact list'}))
          }
          res.end(js({success: true, msg: 'contact list updated'}))
        })
      } else if(body.data.action === 'delete'){

        db.get('contact',function(err, cdata){
          if(err || typeof cdata !== 'object'){cdata = [];}
          for (let i = 0; i < cdata.length; i++) {
            if(cdata[i].hash !== body.data.item){
              arr.push(cdata[i]);
            }
            db.put('contact', arr, function(err){
              if(err){
                return res.end(js({success: false, msg: 'unable to update contact list'}))
              }
              res.end(js({success: true, msg: 'contact list updated'}))
            })
          }
        })
      }

    } else if(body.dest === 'subscribed'){
      if(!post_res.success){
        return res.end(js({success: false, msg: post_res.msg}))
      }
      return res.end(js({success: true, msg: 'subscribers updated'}))
    } else if(body.dest === 'blacklist'){
      if(!post_res.success){
        return res.end(js({success: false, msg: post_res.msg}))
      }
      return res.end(js({success: true, msg: 'blacklist updated'}))
    } else {
      return res.end(js({success: false, msg: 'invalid post data'}))
    }

  })


})

router.post('/fetch', function (req, res) {
  let body = req.body;

  if(['subscribed', 'unsubscribed', 'hitcount', 'contact', 'blacklist'].indexOf(body.dest) !== -1){

    let src = rest_cnf[body.dest].git_url;
    utils.fetch(src, function(err, data){
      if(err){return res.json({error: true, msg: 'unable to sync blacklist'})}
      if(body.dest === 'blacklist'){
        fs.writeJson(rest_dir + '/app/config/blacklist.json', data, function(err){
          if(err){return res.json({error: true, msg: 'unable to store blacklist'})}
          return res.json(data);
        });
      } else{
        return res.json(data);
      }
    })

  } else if(body.dest === 'logs'){

    let obj = {
      responseType: 'json',
      resolveBodyOnly: true,
      headers: {
        'Private-Token': rest_cnf.git.gitlab.token
      }
    }


    let src = rest_cnf.unsubscribed.git_url;
    utils.fetch(src, function(err, data){
      if(err){return res.json({code: 1})}
      res.json(data)
    })

  } else if(body.dest === 'del_subscribed'){



    let src = rest_cnf.unsubscribed.git_url;
    utils.fetch(src, function(err, data){
      if(err){return res.json({code: 1})}
      res.json(data)
    })


  } else if(body.dest === 'contact_item'){

    let src = rest_cnf.contact.msg_url + body.item;
    utils.fetch(src, function(err, data){
      if(err){return res.res.status(500).end()}
      res.json(data)
    })


  } else {
    res.json({code: 1})
  }
})

/*
utils.secure_post({dest: 'subscribed', data: {action: 'test'}, path: rest_cnf.admin_config.base_url}, function(err,res){
  if(err){return cl(err)}
  cl(res);
})
*/


module.exports = router;
