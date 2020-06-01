const fs = require('fs-extra'),
crypto = require('crypto'),
config = require('../config'),
cookie = require('cookie'),
util = require('util'),
enc = require('./enc'),
got = require('got'),
glob = require("glob"),
sec_cnf = require('../config/sec_cnf'),
rest_cnf = require(rest_dir + '/app/config/index.json');

const utils = {
  secure_post: function(obj,cb){
    utils.secure_request(obj.dest, obj.data, function(err, post_obj){
      if(err){return cb(err)}
      utils.post(config.rest_publish_url +'/admin' + obj.path, post_obj, function(err, ctext){
        if(err){return cb(err)}
        if(ctext.success === false){
          return cb(false, js(ctext))
        }
        utils.secure_response(obj.dest, ctext, function(err, ptext){
          if(err){return cb(err)}
          return cb(false, ptext)
        })
      })
    })
  },
  secure_request: function(dest, obj, cb){
    let tk = js({
      token: rest_cnf.token.item,
      date: (Date.now() + rest_cnf.token.throttle),
      dest: dest
    });


    if(typeof obj !== 'string'){
      obj = js(obj);
    }
    enc.encrypt(tk, rest_cnf.token.key.req, function(err, ctext){
      if(err){return cb(err)}
      let auth_cookie = utils.salt_cookie();

      cl(auth_cookie)
      let post_obj = {
        responseType: 'json',
        resolveBodyOnly: true,
        headers: {
          'Content-type':  'application/json',
          cookie: cookie.serialize(rest_cnf.cookie.name, auth_cookie, {
            httpOnly: true,
            secure: true,
            maxAge: sec_cnf.user.duration / 1000
          })
        }

      };

      post_obj.headers[rest_cnf.token.name] = ctext;

      enc.encrypt(obj, rest_cnf.private_api.req[dest], function(err, ctext){
        if(err){return cb(err)}

        enc.ecdsa_sign(ctext, sec_cnf.ecdsa.rest.privateKey, function(err,sig){
          if(err){return cb(err)}
          let body_obj = {
            sig: sig,
            data: ctext
          }
          post_obj.body = js(body_obj);


          return cb(false, post_obj)

        })
      })
    })
  },
  secure_response: function(dest, obj, cb){

    if(typeof obj !== 'object'){
      obj = jp(obj);
    }

    enc.ecdsa_verify(obj.data, sec_cnf.ecdsa.rest.publicKey, obj.sig, function(err,sig){
      if(err){return cb(err)}
      if(!sig){return cb('sig tamper detected')};
      enc.decrypt(obj.data, rest_cnf.private_api.res[dest], function(err, ptext){
        if(err){return cb(err)}
        return cb(false, ptext)
      })
    })

  },
  fetch: function(dest, obj, cb){
    let opt;
    if(typeof obj === 'function'){
      cb = obj;
      opt = {
        responseType: 'json',
        resolveBodyOnly: true
      }
    } else {
      opt = obj;
    }

    got.get(dest, opt)
    .then(function(res){
      res = JSON.parse(res.body);
      cb(false, res)
    })
    .catch(function(err){
      cb(err)
    });
  },
  head: function(dest, cb){
    let is_done = false;
    got.stream(dest, {method: 'HEAD'})
    .on('request', function(req){
      setTimeout(function(){
        if(req){
          req.abort();
          if(!is_done){
            cb(500)
            return is_done = true;
          }
        }
      }, 500)
    })
    .on('response', function(res){
      if(!is_done){
        cb(res.statusCode)
        return is_done = true;
      }
    })
    .on('error', function(res){
      if(!is_done){
        cb(500)
        return is_done = true;
      }
    })
    
  },
  post: function(dest, obj, cb){
    got.post(dest, obj)
    .then(function(res){
      cl(res.body)
      res = JSON.parse(res.body);
      cb(false, res)
    })
    .catch(function(err){
      cb(err)
    });
  },
  salt_cookie: function(){
    let secret = rest_cnf.cookie.items[utils.get_date()],
    salt = rest_cnf.cookie.salt[utils.get_month_index()];

    return crypto.pbkdf2Sync(
      secret, salt, rest_cnf.cookie.config.iterations, rest_cnf.cookie.config.len, rest_cnf.cookie.config.hash
    ).toString('hex')
  },
  snake_case: function(i){
    return i.replace(/ /g, /_/);
  },
  clone: function(i){
    return Object.assign({}, i)
  },
  get_day: function(){
    let d = new Date();
    return d.getDay();
  },
  get_date: function(){
    let d = new Date();
    return d.getDate();

  },
  get_month: function(i){
    let months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
    month = new Date(i);
    month = month.getMonth();
    return months[month];
  },
  get_month_index: function(i){
    i = i || Date.now();
    let month = new Date(i);
    month = month.getMonth();
    return month;
  },
  get_year: function(i){
    let year = new Date(i);
    year = year.getFullYear();
    return JSON.stringify(year);
  },
  item_count_uint16: function(data){
    let c_year = utils.get_year(Date.now()),
    items = [0,0,0,0,0,0,0,0,0,0,0,0],
    p_index;

    for (let i = 0; i < data.length; i++) {
      if(utils.get_year(data[i].date) === c_year){
        p_index = utils.get_month_index(data[i].date);
        items[p_index]++;
        p_index = null;
      }
    }

    return items;
  },
  chunk: function(arr, x){
    let newarr = [];
    for (var i=0;i<Math.ceil(arr.length/x);i++) {
      newarr.push(arr.slice(i*x,i*x+x));
    }
    return newarr;
  },
  sort_number: function(arr){
    const numberSorter = function(a, b){
      a - b;
    };
    return arr.sort(numberSorter);
  },
  map_search: function(){
    let str = 'abcdefghijklmnopqrstuvwxyz'.split('');
    for (let i = 0; i < str.length; i++) {
      let basedir = './blog/api/data/search/alpha/' + str[i];
      fs.mkdir(basedir, function(err){
        if (err) throw err;
        fs.writeFile(basedir + '/index.json', '[]', function(err){
          if (err) throw err;
          fs.writeFile(basedir + '/items.json', '[]', function(err){
            if (err) throw err;
          })
        });
      });
    }
  },
  update_page_order: function(arr, cb){
    fs.readFile('./blog/app/config/index.json', 'utf8', function(err, data){
      if(err){return cb('unable to update page config')};
      data = jp(data);
      data.navlinks = arr;

      fs.writeFile('./blog/app/config/index.json', js(data,0,2), function(err){
        if(err){return cb('unable to save page config')};
        return cb(false)
      })
    })
  },
  list_files: function(url, cb){
    glob(url, function (err, res) {
      if(err){return cb('unable to access files')}
      cb(false, res)
    })
  },
  json2csv: function(arr) {
    const array = [Object.keys(arr[0])].concat(arr)
    return array.map(function(it){
      let res = '"'+ Object.values(it).join('"|"')+ '"';
      return res
    }).join('\n')
  },
  json2xml: function(obj, rootname) {
    var tag = function(name, options) {
      options = options || {};
      return "<"+(options.closing ? "/" : "")+name+">";
    };

    var xml = "";
    for (var i in obj) {
      if(obj.hasOwnProperty(i)){
        var value = obj[i], type = typeof value;
        if (value instanceof Array && type == 'object') {
          for (var sub in value) {
            //xml += utils.json2xml(value[sub]);
            xml += tag(i)+value[sub]+tag(i,{closing:1});
          }
        } else if (value instanceof Object && type == 'object') {
          xml += tag(i)+utils.json2xml(value)+tag(i,{closing:1});
        } else {
          xml += tag(i)+value+tag(i,{closing:1});
        }
      }
    }
    return rootname ? tag(rootname) + xml + tag(rootname,{closing:1}) : xml;

  },
  update_feed_cnf: function(item, obj, cb){
    fs.readJson('./blog/api/feed/index.json', 'utf8', function(err,res){
      if(err){return cb(err)}
      for (let i = 0; i < res[item].length; i++) {
        if(res[item][i].title === obj.title){
          res[item][i] = obj;
        }
      }
      fs.writeJson('./blog/api/feed/index.json', res, function(err){
        if(err){return cb(err)}
        return cb(false)
      })
    })
  },
  rss_base: function(obj, i){
    let arr = [],
    feeds = obj.rss_items[i];

    for (let item in feeds){
      if(item === 'image' || item === 'skipHours'){
        let str = '<'+ item +'>'
        for (let key in feeds[item]){
          str += '<'+ key +'>'+ feeds[item][key] +'</'+ key +'>';
        }
        str += '</'+ item +'>'
        arr.push(str)
      } else {
        arr.push('<'+ item +'>'+ feeds[item] +'</'+ item +'>')
      }
    }
    return arr.join('');

  },
  atom_base: function(obj, i){
    let arr = [],
    feeds = obj.atom_items[i];

    for (let item in feeds){
      if(item === 'author'){
        let str = '<'+ item +'>'
        for (let key in feeds[item]){
          str += '<'+ key +'>'+ feeds[item][key] +'</'+ key +'>';
        }
        str += '</'+ item +'>'
        arr.push(str)
      } else if(item === 'link'){
        arr.push('<'+ item +' href="'+ feeds[item] +'"/>')
      } else if(item === 'category'){
        arr.push('<'+ item +' term="'+ feeds[item] +'"/>')
      } else {
        arr.push('<'+ item +'>'+ feeds[item] +'</'+ item +'>')
      }
    }
    return arr.join('');

  },
  rss_posts_item: function(obj){
    let post_url = [
      '#/post',
      utils.get_year(obj.date),
      utils.get_month(obj.date)
    ].join('/');

    return '<item><title>'+ obj.title +'</title><link>'+ [config.blog_publish_url, post_url, obj.date].join('/') +'</link><description>'+ obj.preview +'</description><pubDate>'+ new Date(obj.date) +'</pubDate><author>'+ obj.author +'</author><category  domain="'+ [config.blog_publish_url,'#/categories', obj.category].join('/') +'">'+ obj.category +'</category><guid isPermaLink="false">'+ obj.date +'</guid></item>';
  },
  atom_posts_item: function(obj){
    let post_url = [
      '#/post',
      utils.get_year(obj.date),
      utils.get_month(obj.date)
    ].join('/');

    return '<entry><id>'+ obj.date +'</id><title>'+ obj.title +'</title><link href="'+ [config.blog_publish_url, post_url, obj.date].join('/') +'"/><summary>'+ obj.preview +'</summary><updated>'+ new Date(obj.date) +'</updated><author><name>'+ obj.author +'</name></author><category term="'+ obj.category +'"/></entry>';
  },
  rss_news_item: function(obj){
    let post_url = [
      '#/news',
      utils.get_year(obj.date)
    ].join('/');
    return '<item><title>'+ obj.title +'</title><link>'+ [config.blog_publish_url, post_url, obj.date].join('/') +'</link><description>'+ obj.preview +'</description><pubDate>'+ new Date(obj.date) +'</pubDate><author>'+ obj.author +'</author><category  domain="'+ [config.blog_publish_url,'#/news'].join('/') +'">'+ obj.category +'</category><guid isPermaLink="false">'+ obj.date +'</guid></item>';
  },
  atom_news_item: function(obj){
    let post_url = [
      '#/news',
      utils.get_year(obj.date)
    ].join('/');

    return '<entry><id>'+ obj.date +'</id><title>'+ obj.title +'</title><link href="'+ [config.blog_publish_url, post_url, obj.date].join('/') +'"/><summary>'+ obj.preview +'</summary><updated>'+ new Date(obj.date) +'</updated><author><name>'+ obj.author +'</name></author><category term="'+ obj.category +'"/></entry>';
  },
  rss_gallery_item: function(obj){
    return '<item><title>'+ obj.title +'</title><link>'+ [config.blog_publish_url, '#/gallery'].join('/') +'</link><description>'+ obj.description +'</description><pubDate>'+ new Date(obj.date) +'</pubDate><author>'+ config.base_url +'</author><category  domain="'+ [config.blog_publish_url,'#/gallery'].join('/') +'">gallery</category><guid isPermaLink="false">'+ obj.date +'</guid></item>';
  },
  atom_gallery_item: function(obj){
    return '<entry><id>'+ obj.date +'</id><title>'+ obj.title +'</title><link href="'+ [config.blog_publish_url, '#/gallery'].join('/') +'"/><summary>'+ obj.description +'</summary><updated>'+ new Date(obj.date) +'</updated><author><name>'+ config.base_url +'</name></author><category term="gallery"/></entry>';
  },
  escape_xml: function(str){
    return str.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
  },
  build_sitemap_index: function(arr, src, cb){

    let item_str,
    item_arr = [],
    final;

    for (let i = 0; i < arr.length; i++) {
      item_str = '<sitemap>'
      for (let val in arr[i]) {
        if(val === 'loc'){
          arr[i][val] = utils.escape_xml(src + arr[i][val]);
        }
        if(arr[i][val] !== ''){
          item_str += ['<', val, '>', arr[i][val], '</', val, '>'].join('')
        }
      }
      item_str += '</sitemap>';
      item_arr.push(item_str);
    }

    final = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      item_arr.join(''),
      '</sitemapindex>'
    ].join('');

    fs.writeFile('./blog/sitemap.xml', final, function(err){
      if(err){
        cl(err);
        return cb('unable to build sitemap index')
      }
      cb(false);
    })
  },
  build_sitemap: function(arr, src, dest, cb){
    let item_str,
    item_arr = [],
    final;

    for (let i = 0; i < arr.length; i++) {
      item_str = '<url>'
      for (let val in arr[i]) {
        if(val === 'loc'){
          arr[i][val] = utils.escape_xml(src + arr[i][val]);
        }
        if(arr[i][val] !== ''){
          item_str += ['<', val, '>', arr[i][val], '</', val, '>'].join('')
        }
      }
      item_str += '</url>';
      item_arr.push(item_str);
    }

    final = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      item_arr.join(''),
      '</urlset>'
    ].join('');

    fs.writeFile('./blog'+ dest, final, function(err){
      if(err){
        cl(err);
        return cb('unable to build sitemap item')
      }
      cb(false);
    })
  }
}



module.exports = utils;
