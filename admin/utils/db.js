const levelup = require('levelup'),
leveldown = require('leveldown'),
crypto = require('crypto'),
enc = require('./enc'),
encode = require('encoding-down'),
config = require('../config'),
app_cnf = require('../../blog/app/config'),
fs = require('fs-extra'),
gzip = require('./gzip'),
archive = require('./archive'),
tar = require('./tar'),
utils = require('./');

const db = levelup(
  encode(leveldown('./admin/db'), {
    valueEncoding: 'json'
  })
),
db_action = {
  put: function(key, val, cb){
    db.put(key, val, function (err) {
      if(err){return cb('unable to store key: '+ key +' to db')};
      cb(false);
    })
  },
  get: function(key, cb){
    db.get(key, function (err, value) {
      if(err){return cb('unable to get key: '+ key +' from db')};
      cb(false, value);
    })
  },
  count_add: function(key, val, cb){
    db.get(key, function (err, value) {
      if(err){value = 0};
      db.put(key, (value + val), function (err) {
        if(err){return cb('unable to store key: '+ key +' to db')};
        cb(false);
      })
    })
  },
  attempts_add: function(ip, cb){
    db.get('login_attempts', function (err, value) {
      if(err){value = []};
      value.push({
        date: Date.now(),
        ip: ip
      })
      db.put('login_attempts', value, function (err) {
        if(err){return cb('unable to store failed attempt to db')};
        return cb(false);
      })
    })
  },
  get_user: function(cb){
    db.get('user', function (err, res) {
      if(err){return cb('unable to get user data')};
      cb(false, res);
    });
  },
  set_user: function(obj, cb){
    db.put('user', obj, function (err) {
      if(err){return cb('unable update user data')};
      cb(false)
    });
  },
  get_posts: function(cb){
    db.get('posts', function (err, res) {
      if(err){return cb('unable to get posts')};
      cb(false, res);
    });
  },
  get_news: function(cb){
    db.get('news', function (err, res) {
      if(err){return cb('unable to get news')};
      cb(false, res);
    });
  },
  get_gallery: function(cb){
    db.get('gallery', function (err,res) {
      if(err){return cb(false, [])};
      cb(false, res);
    });
  },
  set_gallery: function(arr, cb){
    db.put('gallery', arr, function (err){
      if(err){return cb('unable to get news')};
      db_action.sort_gallery(arr, function(err){
        if(err){return cb(err)}
        cb(false);
      })
    });
  },
  add_gallery: function(obj, cb){
    db_action.get_gallery(function(err, res){
      if(err){return cb('unable to get gallery')};
      let exists = false;
      for (let i = 0; i < res.length; i++) {
        if(res[i].url === obj.url){
          exists = true;
        }
      }
      if(!exists){
        obj.date = Date.now();
        res.unshift(obj);
        db.put('gallery', res, function (err) {
          if(err){return cb('unable to update gallery')};
          db_action.sort_gallery(res, function(err){
            if(err){return cb(err)}
            cb(false);
          })
        });
      } else {
        cb('gallery item already exists');
      }

    });
  },
  del_gallery: function(item, cb){
    db_action.get_gallery(function(err, res){
      if(err){return cb('unable to get gallery')};
      let arr = [];
      for (let i = 0; i < res.length; i++) {
        if(res[i].date !== item){
          arr.push(res[i]);
        }
      }
      db.put('gallery', arr, function (err) {
        if(err){return cb('unable to delete gallery item')};
        db_action.sort_gallery(arr, function(err){
          if(err){return cb(err)}
          cb(false);
        })
      });
    });
  },
  sort_gallery: function(arr, cb){
    let gal_path = './blog/api/gallery/';
    fs.writeJson(gal_path +'index/index.json', arr, function(err){
      if(err){return cb('unable to update gallery index')}
      gzip.zip(gal_path +'index/index.json', function(err){
        if(err){cl('unable to gzip gallery index')}
        arr.reverse();
        fs.writeJson(gal_path +'reverse/index.json', arr, function(err){
          if(err){return cb('unable to update gallery reverse index')}
          gzip.zip(gal_path +'reverse/index.json', function(err){
            if(err){cl('unable to gzip gallery reverse index')}
            arr = arr.sort(function(a, b) {
              return a.title.localeCompare(b.title)
            });
            fs.writeJson(gal_path +'title/index.json', arr, function(err){
              if(err){return cb('unable to update gallery title index')}
              gzip.zip(gal_path +'title/index.json', function(err){
                if(err){cl('unable to gzip gallery title index')}
                db_action.rss_atom_gen('gallery', function(err, res){
                  if(err){return cb(err)}
                  return cb(false);
                })
              })
            })
          })
        })
      })
    })
  },
  get_imports: function(cb){
    db.get('imports', function (err, res) {
      if(err || res === []){
        let base = [{name: 'h', url: '/app/modules/h.mjs'},{name: 'events', url: "/app/modules/events.mjs"}];
        db.put('imports', base, function(){
          return cb(base)
        })
      };
      return cb(res);
    });
  },
  get_post: function(obj,cb){
    db.get('posts', function (err, res) {
      if(err){return cb('unable to get posts')};
      let newobj;
      for (let i = 0; i < res.length; i++) {
        if(res[i].date === obj.date){
          newobj = res[i];
        }
      }
      cb(false, newobj);
    });
  },
  update_page_status: function(obj, cb){
    db_action.get('pages', function(err,res){
      if(err){cb('db page error')};
      for (let i = 0; i < res.length; i++) {
        if(res[i].title === obj.title){
          res[i].status = obj.status;
        }
      }
      db_action.put('pages', res, function(err){
        if(err){cb('unable to update page db')};
        fs.readFile('./blog/app/config/index.json', 'utf8', function(err, data){
          if(err){return cb('unable to update page config')};
          data = jp(data);
          let arr = [];
          if(obj.status){
            data.navlinks.push(obj.title)
          } else {
            for (let i = 0; i < data.navlinks.length; i++) {
              if(data.navlinks[i] !== obj.title){
                arr.push(data.navlinks[i])
              }
            }
            data.navlinks = arr;
          }

          fs.writeFile('./blog/app/config/index.json', js(data,0,2), function(err){
            if(err){return cb('unable to save page config')};
            return cb(false)
          })
        })

      })

    })
  },
  create_page: function(obj, cb){
    db_action.get('pages', function(err,res){
      if(err){res = []};

      obj.title = obj.title.trim();

      if(obj.title === '' || obj.data === ''){
        return cb('page data incomplete')
      }

      for (let i = 0; i < res.length; i++) {
        if(res[i].title === obj.title){
          return cb('page title already exists')
        }
      }

      res.push(obj);

      let str = '',
      str2 = '';

      for (let i = 0; i < res.length; i++) {
        if(res[i].mode === 'html'){
          str+= res[i].title+ ': function(main, cnf){cnf({sidebar: '+ res[i].data[0] +'});main.innerHTML = "'+ res[i].data[1] +'"},';
        } else {
          str+= res[i].title+ ': function(main, cnf){cnf({sidebar: '+ res[i].data[0] +'});'+ res[i].data[1] +'},';
        }
      }

      db_action.get_imports(function(imp){

        for (let i = 0; i < imp.length; i++) {
          str2+= 'import { '+ imp[i].name +' } from  "'+ imp[i].url +'";\n'
        }

        str = str2 + '\nconst pages = {\n'+ str.slice(0,-1) +'\n}\nexport { pages }';

        fs.writeFile('./blog/app/plugins/pages/index.mjs', str, function(err){
          if(err){return cb('unable to save new page')};
          db.put('pages', res, function (err) {
            if(err){return cb('unable to add page')};
            if(obj.status){
              fs.readFile('./blog/app/config/index.json', 'utf8', function(err, data){
                if(err){return cb('unable to update page config')};
                data = jp(data);
                data.navlinks.push(obj.title)
                fs.writeFile('./blog/app/config/index.json', js(data,0,2), function(err){
                  if(err){return cb('unable to save page config')};
                  return cb(false)
                })
              })
            }
            return cb(false)
          });
        })
      })
    })
  },
  edit_page: function(obj, cb){
    db_action.get('pages', function(err,res){
      if(err){res = []};

      obj.title = obj.title.trim();

      if(obj.title === '' || obj.data === ''){
        return cb('page data incomplete')
      }

      for (let i = 0; i < res.length; i++) {
        if(res[i].title === obj.title){
          res[i] = obj;
        }
      }

      let str = '',
      str2 = '';

      for (let i = 0; i < res.length; i++) {
        if(res[i].mode === 'html'){
          str+= res[i].title+ ': function(main, cnf){cnf({sidebar: '+ res[i].data[0] +'});main.innerHTML = "'+ res[i].data[1] +'"},';
        } else {
          str+= res[i].title+ ': function(main, cnf){cnf({sidebar: '+ res[i].data[0] +'});'+ res[i].data[1] +'},';
        }
      }


      db_action.get_imports(function(imp){

        for (let i = 0; i < imp.length; i++) {
          str2+= 'import { '+ imp[i].name +' } from  "'+ imp[i].url +'";\n'
        }

        str = str2 + '\nconst pages = {\n'+ str.slice(0,-1) +'\n}\nexport { pages }';

        fs.writeFile('./blog/app/plugins/pages/index.mjs', str, function(err){
          if(err){return cb('unable to update page')};
          db.put('pages', res, function (err) {
            if(err){return cb('unable to update page')};
            return cb(false)
          });
        })
      })

    })
  },
  delete_page: function(obj, cb){
    db_action.get('pages', function(err,res){
      if(err){return cb('unable to get page data')};
      let arr = []

      for (let i = 0; i < res.length; i++) {
        if(res[i].title !== obj.title){
          arr.push(res[i])
        }
      }

      let str = '',
      str2 = '';
      for (let i = 0; i < arr.length; i++) {
        if(arr[i].mode === 'html'){
          str+= arr[i].title+ ': function(main, cnf){cnf({sidebar: '+ arr[i].data[0] +'});main.innerHTML = "'+ arr[i].data[1] +'"},';
        } else {
          str+= arr[i].title+ ': function(main, cnf){cnf({sidebar: '+ arr[i].data[0] +'});'+ arr[i].data[1] +'},';
        }
      }

      db_action.get_imports(function(imp){

        for (let i = 0; i < imp.length; i++) {
          str2+= 'import { '+ imp[i].name +' } from  "'+ imp[i].url +'";\n'
        }

        str = str2 + '\nconst pages = {\n'+ str.slice(0,-1) +'\n}\nexport { pages }';

        fs.writeFile('./blog/app/plugins/pages/index.mjs', str, function(err){
          if(err){return cb('unable to save new page')};
          db.put('pages', arr, function (err) {
            if(err){return cb('unable to add page')};
            if(obj.status){
              fs.readFile('./blog/app/config/index.json', 'utf8', function(err, data){
                if(err){return cb('unable to update page config')};
                data = jp(data);
                arr = [];
                for (let i = 0; i < data.navlinks.length; i++) {
                  if(data.navlinks[i] !== obj.title){
                    arr.push(data.navlinks[i])
                  }
                }
                data.navlinks = arr;
                fs.writeFile('./blog/app/config/index.json', js(data,0,2), function(err){
                  if(err){return cb('unable to save page config')};
                  return cb(false)
                })
              })
            }
            return cb(false)
          });
        })
      })

    })
  },
  sort_rest_post: function(src, obj, sel, cb) {
    const cat = obj[src[1]];

    let dest = 'search';
    if (src[0] === 'news') {
      dest = src[0];
    }

    let dest_db = [src[1], src[0]].join('_');

    db.get(dest_db, function(err, val) {
      if (err) {
        val = {}
      };
      const dest_dir = ['./blog/api/data', dest, src[2], cat].join('/');
      if (sel === 'add') {
        if (!val[cat]) {
          val[cat] = [];
          try {
            fs.mkdirSync(dest_dir);
          } catch (err) {
            if (err) {
              cl(err)
            }
          }
        }
        val[cat].unshift(obj);
      } else if (sel === 'update') {
        for (let i = 0; i < val[cat].length; i++) {
          if (val[cat][i].title === obj.title) {
            val[cat][i] = obj;
          }
        }
      } else if (sel === 'delete') {
        let new_arr = []
        for (let i = 0; i < val[cat].length; i++) {
          if (val[cat][i].title !== obj.title) {
            new_arr.push(val[cat][i]);
          }
        }

        if (new_arr.length < 1) {
          delete val[cat]
          try {
            fs.removeSync(dest_dir)
          } catch (err) {
            if (err) {
              cl('unable to delete ' + dest_dir + ' folder')
            }
          }
        } else {
          val[cat] = new_arr;
        }
      }

      db.put(dest_db, val, function(err) {
        if (err) {
          return cb('unable to update ' + dest_db + ' db')
        };
        try {
          if (!val[cat]) {
            return cb(false)
          }

          db_action.rss_atom_cat_gen(src[0], cat, val[cat], src[2], function(err) {
              if (err) {
                return cl(err)
              }

              let res = utils.chunk(val[cat], app_cnf.paginate_max),
                dest_index = ['./blog/api/data', dest, src[2], cat, 'index.json'].join('/');
              for (let i = 0; i < res.length; i++) {
                fs.writeFileSync(['./blog/api/data', dest, src[2], cat, (i + 1) + '.json'].join('/'), js(res[i]));
              }
              fs.readFile(dest_index, 'utf8', function(err, data) {
                if (err) {
                  data = {
                    pagination: {
                      pages: res.length,
                      count: val[cat].length
                    }
                  }
                } else {
                  data = jp(data);
                  data.pagination.pages = res.length;
                  data.pagination.count = val[cat].length;
                }
                fs.writeFile(dest_index, js(data), function(err) {
                  if (err) throw err;
                  if (src[1] === 'author') {
                    fs.readFile('./blog/api/data/search/author/index.json', 'utf8', function(err, authdata) {
                      if (err) throw err;
                      authdata = jp(authdata);
                      let dnow = Date.now();
                      for (let i = 0; i < authdata.length; i++) {
                        if (authdata[i].author === obj.author) {
                          authdata[i].post_count = val[cat].length;
                          authdata[i].last_post = dnow;
                          if (authdata[i].first_post === '') {
                            authdata[i].first_post = dnow;
                          }
                          break;
                        }
                      }
                      fs.writeFile('./blog/api/data/search/author/index.json', js(authdata), function(err) {
                        if (err) throw err;
                        return cb(false);
                      })
                    })

                  } else {
                    return cb(false);
                  }

                })
              })
            })
          } catch (err) {
            if (err) {
              cl(err)
              return cb('unable to update ' + src[1] + ' ' + src[0] + ' files');
            };
          }
      });
    })
  },
  sort_tags_post: function(obj, sel, cb){

    let tags = obj.tags,
    len = tags.length,
    cnt = 1;


    db.get('tags_post', function (err, val) {
      if(err){
        val = {}
      };

      for (let i = 0; i < len; i++) {
        let dest_dir = './blog/api/data/search/tag/'+ tags[i];

        if(sel === 'add'){
          if(!val[tags[i]]){
            val[tags[i]] = [];
            try {
              fs.mkdirSync(dest_dir);
            } catch (err) {}
          }
          val[tags[i]].unshift(obj);
        } else if(sel === 'update'){
          for (let x = 0; x < val[tags[i]].length; x++) {
            if(val[tags[i]][x].title === obj.title){
              val[tags[i]][x] = obj;
            }
          }
        } else if(sel === 'delete'){
          let new_arr = [];
          for (let x = 0; x < val[tags[i]].length; x++) {
            if(val[tags[i]][x].title !== obj.title){
              new_arr.push(val[tags[i]][x]);
            }
          }

          if(new_arr.length < 1){
            delete val[tags[i]]
            try {
              fs.removeSync(dest_dir)
            } catch (err) {
              if(err){cl('unable to delete cat:'+ dest_dir)}
            }
          } else {
            val[tags[i]] = new_arr;
          }

        }

        db.put('tags_post', val, function(err) {
          if(err){return cb('unable to update tags_post db')};
          try {

            if(!val[tags[i]]){
              if(cnt === len){
                cb(false);
              } else {
                cnt++
              }
              return;
            }


            let res = utils.chunk(val[tags[i]], app_cnf.paginate_max);
            for (let x = 0; x < res.length; x++) {
              fs.writeFileSync(['./blog/api/data/search/tag', tags[i], (x+1)+ '.json'].join('/'), js(res[x]));
            }
            fs.readFile('./blog/api/data/search/tag/'+ tags[i] +'/index.json', 'utf8', function(err, data){
              if(err){
                data = {
                  pagination: {
                    pages: res.length,
                    count: val[tags[i]].length
                  }
                }
              } else {
                data = jp(data);
                data.pagination.pages = res.length
                data.pagination.count = val[tags[i]].length
              }
              fs.writeFile('./blog/api/data/search/tag/'+ tags[i] +'/index.json', js(data), function(err){
                if(err) throw err;
                if(cnt === len){
                  cb(false);
                } else {
                  cnt++
                }
                return;
              })
            })
          } catch (err) {
            if(err){return cb('unable to update tag post files')};
          }
        });
      }

    })

  },
  update_month_index: function(items, item, cb){
    let arr = [],
    index_path = [
      './blog/api/data/post',
      utils.get_year(item.date),
      utils.get_month(item.date)
    ].join('/');

    for (let i = 0; i < items.length; i++) {
      if(utils.get_year(items[i].date) === utils.get_year(item.date) && utils.get_month(items[i].date) === utils.get_month(item.date)){
        delete items[i].body;
        delete items[i].subtitle;
        delete items[i].image;
        arr.push(items[i])
      }
    }

    const postlen = arr.length;
    arr = utils.chunk(arr, app_cnf.paginate_max);
    let obj = {
      pagination: {
        pages: arr.length,
        count: postlen
      }
    },
    index_main = [index_path, 'index.json'].join('/'),
    index_item;

    for (let i = 0; i < arr.length; i++) {
      index_item = [index_path, (i+1)+ '.json'].join('/');
      fs.writeFileSync(index_item, js(arr[i]));
    }
    fs.writeFile(index_main, js(obj), function(err){
      if(err){return cb('unable to update month index')}
      cb(false)
    })
  },
  create_news: function(obj, cb){
    db_action.get_news(function(err,result){
      if(err){result = []};

      obj.title = obj.title.trim();

      for (let i = 0; i < result.length; i++) {
        if(result[i].title === obj.title){
          return cb('news title already exists')
        }

        if(result[i].date === obj.date){
          return cb('news date already exists, try again')
        }
      }

      result.unshift(obj);

      db.put('news', result, function (err) {
        if(err){return cb('unable to add news entry')};
        db_action.put('newscount', result.length, function(err){
          if(err){return cb('unable to update news count')};

          let filename = [
            './blog/api/data/news/items',
            utils.get_year(obj.date),
            obj.date
          ].join('/'),
          main_obj = utils.clone(obj);
          delete main_obj.preview;

          fs.writeFile(filename+ '.json', js(main_obj), function(err){
            if(err){return cb('unable to create news entry file')};

            delete obj.body;

            db_action.sort_rest_post(['news', 'category', 'cat'] , obj, 'add', function(err){
              if(err){return cb(err)}

              db_action.news_index_create(function(err){
                if(err){return cb(err)}
                db_action.rss_atom_gen('news', function(err, res){
                  if(err){return cb(err)}
                  return cb(false);
                })
              })
            })
          })

        })
      });
    })
  },
  update_news: function(obj, cb){
    db_action.get_news(function(err,res){
      if(err){res = []};

      let arr = []
      for (let i = 0; i < res.length; i++) {
        if(res[i].date !== obj.date){
          arr.push(res[i])
        }
      }
      arr.push(obj);

      db.put('news', arr, function (err) {
        if(err){return cb('unable to add news entry')};
        let filename = [
          './blog/api/data/news/items',
          utils.get_year(obj.date),
          obj.date
        ].join('/'),
        main_obj = utils.clone(obj);
        delete main_obj.preview;

        fs.writeFile(filename+ '.json', js(main_obj), function(err){
          if(err){return cb('unable to create news entry file')};
          delete obj.body;
          db_action.sort_rest_post(['news', 'category', 'cat'], obj, 'update', function(err){
            if(err){return cb(err)}
            db_action.news_index_create(function(err){
              if(err){return cb(err)}
              return cb(false);
            })
          })
        })
      });
    })
  },
  delete_news: function(obj, cb){
    db_action.get_news(function(err,result){
      if(err){result = []};
      let arr = [],
      title;
      for (let i = 0; i < result.length; i++) {
        if(result[i].date !== obj.date){
          arr.push(result[i])
        } else {
          title = result[i].title;
        }
      }

      db.put('news', arr, function (err) {
        if(err){return cb('unable to add post')};
        db_action.put('newscount', arr.length, function(err){
          if(err){return cb('unable to update news count')};

          let filename = [
            './blog/api/data/news/items',
            utils.get_year(obj.date),
            obj.date
          ].join('/');

          fs.unlink(filename+ '.json', function(err){
            if(err){return cb('unable to create post file')};
            delete obj.body;
            db_action.sort_rest_post(['news', 'category', 'cat'], obj, 'delete', function(err){
              if(err){return cb(err)}
              db_action.news_index_create(function(err){
                if(err){return cb(err)}
                return cb(false);
              })
            })
          })

        })
      });
    })
  },
  create_post: function(obj, cb){
    db_action.get_posts(function(err,result){
      if(err){result = []};
      let postindex = Math.floor((result.length / 20) + 1),
      monthIndex

      obj.title = obj.title.trim();

      for (let i = 0; i < result.length; i++) {
        if(result[i].title === obj.title){
          return cb('post title already exists')
        }

        if(result[i].date === obj.date){
          return cb('post date already exists, try again')
        }
      }

      result.unshift(obj);

      db.put('posts', result, function (err) {
        if(err){
          cl(err)
          return cb('unable to add post')
        };
        db_action.put('postcount', result.length, function(err){
          if(err){return cb('unable to update post count')};
          let filename = [
            './blog/api/data/post',
            utils.get_year(obj.date),
            utils.get_month(obj.date),
            obj.date
          ].join('/'),
          searchname = obj.title.toLowerCase(),
          searchtitle = searchname.split(' ')[0]

          fs.writeFile(filename+ '.json', js(obj), function(err){
            if(err){
              cl(err)
              return cb('unable to create post file')
            };

            let searchurl = './blog/api/data/search/alpha/'+ searchtitle.slice(0,1) +'/';

            fs.readFile(searchurl +'/index.json', 'utf8', function(err,res){
              if(err){return cb('unable to open search index')};
              res = jp(res);
              if(res.indexOf(searchtitle) === -1){
                res.push(searchtitle);
                fs.writeFileSync(searchurl +'/index.json', js(res));
              }
              fs.readFile(searchurl +'/items.json', 'utf8', function(err,res){
                if(err){return cb('unable to open search items')};
                res = jp(res);
                res.push({title: obj.title, date: obj.date})
                fs.writeFile(searchurl +'/items.json', js(res), function(err){
                  if(err){return cb('unable to update search items')};
                  db_action.index_create(function(err,res){
                    if(err){return cb('unable to update post index')};
                    delete obj.body;
                    delete obj.subtitle;
                    delete obj.image;
                    db_action.update_month_index(result, obj, function(err){
                      if(err){return cb(err)}
                      db_action.sort_rest_post(['post', 'category', 'cat'], obj, 'add', function(err){
                        if(err){return cb(err)}
                        db_action.sort_rest_post(['post', 'author', 'author'], obj, 'add', function(err){
                          if(err){return cb(err)}
                          db_action.sort_tags_post(obj, 'add', function(err){
                            if(err){return cb(err)}
                            db_action.rss_atom_gen('posts', function(err, res){
                              if(err){return cb(err)}
                              return cb(false);
                            })
                          })
                        })
                      })
                    })
                  })
                });
              })
            })

          })
        })
      });
    })
  },
  delete_post: function(obj, cb){
    db_action.get_posts(function(err,result){
      if(err){return cb('post not found')};
      let arr = [],
      title;
      for (let i = 0; i < result.length; i++) {
        if(result[i].date !== obj.date){
          arr.push(result[i])
        } else {
          title = result[i].title;
          obj = result[i];
        }
      }

      db.put('posts', arr, function (err) {
        if(err){return cb('unable to delete post')};
        db_action.put('postcount', arr.length, function(err){
          if(err){return cb('unable to update post count')};
          let filename = [
            './blog/api/data/post',
            utils.get_year(obj.date),
            utils.get_month(obj.date),
            obj.date
          ].join('/'),
          searchname = title.toLowerCase(),
          searchtitle = searchname.split(' ')[0];

          fs.unlink(filename+ '.json', function(err){
            if (err) throw err;
            let searchurl = './blog/api/data/search/alpha/'+ searchtitle.slice(0,1) +'/';

            fs.readFile(searchurl +'/items.json', 'utf8', function(err,res){
              if(err){return cb('unable to open search items')};
              res = jp(res);
              let count = 0;
              arr = [];
              for (let i = 0; i < res.length; i++) {
                if(res[i].date !== obj.date){
                  arr.push(res[i])
                }
                if(res[i].title.split(' ')[0] === searchtitle){
                  count++
                }
              }
              fs.writeFile(searchurl +'/items.json', js(arr), function(err){
                if(err){return cb('unable to update search items')};
                if(count < 2){
                  fs.readFile(searchurl +'/index.json', 'utf8', function(err,res){
                    if(err){return cb('unable to open search index')};
                    res = jp(res);
                    arr = [];
                    for (let i = 0; i < res.length; i++) {
                      if(res[i] !== searchtitle){
                        arr.push(res[i])
                      }
                    }
                    fs.writeFileSync(searchurl +'/index.json', js(arr));
                  })
                }
                db_action.update_month_index(result, obj, function(err){
                  if(err){return cb(err)}
                  db_action.index_create(function(err){
                    if(err){return cb('unable to update post index')};
                    db_action.sort_rest_post(['post', 'category', 'cat'], obj, 'delete', function(err){
                      if(err){return cb(err)}
                      db_action.sort_rest_post(['post', 'author', 'author'], obj, 'delete', function(err){
                        if(err){return cb(err)}
                        db_action.sort_tags_post(obj, 'delete', function(err){
                          if(err){return cb(err)}
                          return cb(false);
                        })
                      })
                    })
                  })
                })
              });
            })
          });
        })
      });
    })
  },
  update_post: function(obj, cb){
    db_action.get_posts(function(err,res){
      if(err){return cb('post not found')};
      let arr = []
      for (let i = 0; i < res.length; i++) {
        if(res[i].date !== obj.date){
          arr.push(res[i])
        }
      }
      arr.push(obj);
      db.put('posts', arr, function (err) {
        if(err){return cb('unable to update post')};
        let filename = [
          './blog/api/data/post',
          utils.get_year(obj.date),
          utils.get_month(obj.date),
          obj.date
        ].join('/');
        fs.writeFile(filename+ '.json', js(obj), function(err){
          if(err){return cb('unable to create post file')};
          db_action.index_create(function(err){
            if(err){return cb('unable to update post index')};
            delete obj.body;
            delete obj.subtitle;
            delete obj.image;
            db_action.update_month_index(res, obj, function(err){
              if(err){return cb(err)}
              db_action.sort_rest_post(['post', 'category', 'cat'], obj, 'update', function(err){
                if(err){return cb(err)}
                db_action.sort_rest_post(['post', 'author', 'author'], obj, 'update', function(err){
                  if(err){return cb(err)}
                  db_action.sort_tags_post(obj, 'update', function(err){
                    if(err){return cb(err)}
                    cb(false)
                  })
                })
              })
            })
          })
        })
      });
    })
  },
  empty_posts: function(obj, cb){
    db.put('posts', [], function (err) {
      if(err){return cb('unable to delete app posts')};
      db_action.put('postcount', 0, function(err){
        if(err){return cb('unable to update post count')};
        cb(false);
      })
    });
  },
  index_create: function(cb){
    db_action.get_posts(function(err,res){
      if(err){return cb(true)};
      const postlen = res.length;
      let tagcat = {
        tag: [],
        cat: [],
        tag_len: [],
        cat_len: [],
      },
      list_arr = [];

      for (let i = 0; i < postlen; i++) {
        if(tagcat.cat.indexOf(res[i].category)  === -1){
          tagcat.cat.push(res[i].category)
          tagcat.cat_len.push({item: res[i].category, count: 1})
        } else {
          for (let x = 0; x < tagcat.cat_len.length; x++) {
            if(tagcat.cat_len[x].item === res[i].category){
              tagcat.cat_len[x].count++;
            }
          }
        }
        for (let x = 0; x < res[i].tags.length; x++) {
          if(tagcat.tag.indexOf(res[i].tags[x])  === -1){
            tagcat.tag.push(res[i].tags[x])
            tagcat.tag_len.push({item: res[i].tags[x], count: 1})
          } else {
            for (let y = 0; y < tagcat.tag_len.length; y++) {
              if(tagcat.tag_len[y].item === res[i].tags[x]){
                tagcat.tag_len[y].count++;
              }
            }
          }
        }

        list_arr.push(res[i].date);

        delete res[i].body;
        delete res[i].subtitle;
        delete res[i].image;
      }

      let reverse_search = res.map(function(item,idx){
        return res[res.length-1-idx]
      })

      list_arr = utils.sort_number(list_arr);
      reverse_search = utils.chunk(reverse_search, app_cnf.paginate_max);
      res = utils.chunk(res, app_cnf.paginate_max);

      let obj = {
        pagination: {
          pages: res.length,
          count: postlen
        }
      },
      list_obj = {
        list_len: app_cnf.list_paginate_max,
        list_total: postlen,
        first_post: list_arr[0],
        last_post: list_arr.slice(-1)[0],
        index: []
      },
      indexurl = './blog/api/data',
      index_main = [indexurl, 'index.json'].join('/'),
      list_path = indexurl + '/post/list';

      list_arr = utils.chunk(list_arr, app_cnf.list_paginate_max);

      for (let i = 0; i < list_arr.length; i++) {
        list_obj.index.push({
          first: list_arr[i][0],
          last: list_arr[i].slice(-1)[0],
        })
        fs.writeJsonSync([list_path, i +'.json'].join('/'), list_arr[i]);
      }
      fs.writeJsonSync([list_path, 'index.json'].join('/'), list_obj);

      for (let i = 0; i < res.length; i++) {
        fs.writeJsonSync([indexurl, 'search/index', (i+1) +'.json'].join('/'), res[i]);
        fs.writeJsonSync([indexurl, 'search/reverse', (i+1) +'.json'].join('/'), reverse_search[i]);
      }

      fs.readJson(index_main, 'utf8', function(err, data){
        if(err){return cb('unable to access post index')}
        data.post_count = postlen;
        fs.writeJson(index_main, data, function(err){
          if(err){return cb('unable to update post index')}
          fs.writeJson([indexurl, 'search/index/index.json'].join('/'), obj, function(err){
            if(err){return cb('unable to update post search index')}
            fs.writeJson([indexurl, 'search/reverse/index.json'].join('/'), obj, function(err){
              if(err){return cb('unable to update post reverse index')}
              fs.readJson([indexurl, 'tagcat.json'].join('/'), 'utf8', function(err, data){
                if(err){return cb('unable to load tagcat index')}
                data.tag = tagcat.tag;
                data.cat = tagcat.cat;
                data.tag_len = tagcat.tag_len;
                data.cat_len = tagcat.cat_len;
                fs.writeJson([indexurl, 'tagcat.json'].join('/'), data, function(err){
                  if(err){return cb('unable to update tagcat index')}
                  return cb(false);
                })
              })
            })
          })
        })
      })

    })
  },
  news_index_create: function(cb){
    db_action.get_news(function(err,res){
      if(err){return cb(true)};
      const newslen = res.length;
      let cat_arr = [],
      list_arr = [],
      news_len = [];

      for (let i = 0; i < res.length; i++) {
        delete res[i].body;
        if(cat_arr.indexOf(res[i].category) === -1){
          cat_arr.push(res[i].category);
          news_len.push({item: res[i].category, count: 1})
        } else {
          for (let x = 0; x < news_len.length; x++) {
            if(news_len[x].item === res[i].category){
              news_len[x].count++;
            }
          }
        }

        list_arr.push(res[i].date);
      }

      let reverse_search = res.map(function(item,idx){
        return res[res.length-1-idx]
      })

      reverse_search = utils.chunk(reverse_search, app_cnf.paginate_max);
      res = utils.chunk(res, app_cnf.paginate_max);
      list_arr = utils.sort_number(list_arr);

      let obj = {
        pagination: {
          pages: res.length,
          count: newslen
        }
      },
      list_obj = {
        list_len: app_cnf.list_paginate_max,
        list_total: newslen,
        first_post: list_arr[0],
        last_post: list_arr.slice(-1)[0],
        index: []
      },
      indexurl = './blog/api/data',
      index_main = [indexurl, 'index.json'].join('/'),
      list_path = indexurl + '/news/items/list';


      list_arr = utils.chunk(list_arr, app_cnf.list_paginate_max);

      for (let i = 0; i < list_arr.length; i++) {
        list_obj.index.push({
          first: list_arr[i][0],
          last: list_arr[i].slice(-1)[0]
        })
        fs.writeJsonSync([list_path, i +'.json'].join('/'), list_arr[i]);
      }
      fs.writeJsonSync([list_path, 'index.json'].join('/'), list_obj);

      fs.writeJsonSync([indexurl, 'news/cat','index.json'].join('/'), cat_arr);

      for (let i = 0; i < res.length; i++) {
        fs.writeJsonSync([indexurl, 'news/index', (i+1) +'.json'].join('/'), res[i]);
        fs.writeJsonSync([indexurl, 'news/reverse', (i+1) +'.json'].join('/'), reverse_search[i]);
      }

      fs.readJson(index_main, 'utf8', function(err, data){
        if(err){return cb('unable to access news index')}
        data.news_count = newslen;
        fs.writeJson(index_main, data, function(err){
          if(err){return cb('unable to update news main index')}
          fs.writeJson([indexurl, 'news/index/index.json'].join('/'), obj, function(err){
            if(err){return cb('unable to update news index')}
            fs.writeJson([indexurl, 'news/reverse/index.json'].join('/'), obj, function(err){
              if(err){return cb('unable to update news reverse index')}
              fs.readJson([indexurl, 'tagcat.json'].join('/'), 'utf8', function(err,tcdat){
                if(err){return cb('unable to read tagcat index')}
                tcdat.news_len = news_len;
                fs.writeJson([indexurl, 'tagcat.json'].join('/'), tcdat, function(err){
                  if(err){return cb('unable to update tagcat index')}
                  return cb(false);
                })
              })
            })
          })
        })
      })

    })
  },
  set_imports: function(cb){
    db_action.get('pages', function(err,res){
      if(err){res = []};

      let str = '',
      str2 = '';

      for (let i = 0; i < res.length; i++) {
        if(res[i].mode === 'html'){
          str+= res[i].title+ ': function(main, cnf){cnf({sidebar: '+ res[i].data[0] +'});main.innerHTML = "'+ res[i].data[1] +'"},';
        } else {
          str+= res[i].title+ ': function(main, cnf){cnf({sidebar: '+ res[i].data[0] +'});'+ res[i].data[1] +'},';
        }
      }

      db_action.get_imports(function(imp){

        for (let i = 0; i < imp.length; i++) {
          str2+= 'import { '+ imp[i].name +' } from  "'+ imp[i].url +'";\n'
        }

        str = str2 + '\nconst pages = {\n'+ str.slice(0,-1) +'\n}\nexport { pages }';

        fs.writeFile('./blog/app/plugins/pages/index.mjs', str, function(err){
          if(err){return cb('unable to set imports')};
          return cb(false);
        })
      })

    })
  },
  page_base_update: function(obj, minify, mincnf, cb){
    if(typeof obj === 'function'){
      cb = obj;
      obj = {
        meta: '<meta charset="utf-8">',
        css: '',
        js_top: '<script type="module" src="./app/modules/main.mjs"></script>',
        body: ''
      }
    }
    let base_html = minify("<!DOCTYPE html><html><head>"+ obj.meta + obj.css + obj.js_top +"<script type='application/ld+json'>"+ obj.jsonld +"</script></head><body>"+ obj.body +"</body></html>", mincnf);

    db.put('page_base', obj, function (err) {
      if(err){return cb('unable to reset page base')};
      fs.writeFile('./blog/index.html', base_html, function(err){
        if(err){return cb('unable to reset index.html')};
        cb(false, obj);
      })
    })
  },
  page_base: function(cb){
    db_action.get('page_base', function(err, res){
      if(err){
        db_action.page_base_update(function(err, res){
          if(err){
            return cb('unable to get page base data')
          }
          return cb(false, res)
        })
      }
      return cb(false, res)
    })
  },
  dump_post_xml: function(sel, cb){
    let dest = 'posts';
    if(sel === 'news_dump' || sel === 'news_recent'){
      dest = 'news';
    }
    if(sel === 'gallery_dump'){
      dest = 'gallery';
    }

    db_action.get(dest, function(err,res){
      if(err){return cb(err)}
      let str = '',
      title = 'blog_'+ sel +'.xml',
      obj = {};

      dest = ['./blog/api/feed', sel, title].join('/');
      if(sel === 'post_recent' || sel === 'news_recent'){
        res = res.slice(0, config.feed.recent_count);
      }
      for (let i = 0; i < res.length; i++) {
        res[i].title = encodeURIComponent(res[i].title);
        if(dest !== 'gallery'){
          res[i].body = encodeURIComponent(res[i].body);
          res[i].subtitle = encodeURIComponent(res[i].subtitle);
          res[i].preview = encodeURIComponent(res[i].preview);
          str+= utils.json2xml(res[i], 'post')
        } else {
          res[i].description = encodeURIComponent(res[i].description);
          str+= utils.json2xml(res[i], 'item')
        }


      }
      res = ['<?xml version="1.0" encoding="UTF-8"?><root>', str, '</root>'].join('');

      obj.title = title;
      obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
      obj.size = res.length;
      obj.date = Date.now();

      utils.update_feed_cnf(sel, obj, function(err){
        if(err){return cb(err)}
        fs.writeFile(dest, res, function(err){
          if(err){return cb(err)}
          gzip.zip(dest, function(err){
            if(err){return cb('gzip error')}
            archive.create({src: dest, name: title, dest: dest +'.zip', type: 'zip'}, function(err, sz){
              if(err){return cb(err)}
              obj.size = sz;
              obj.title = title + '.zip';
              fs.readFile(dest+ '.zip', 'utf8', function(err,res){
                if(err){return cb(err)}
                obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
                utils.update_feed_cnf(sel, obj, function(err){
                  tar.create({name: dest, files: [dest]}, function(err){
                    if(err){return cb(err)}
                    obj.title = title + '.tgz'
                    fs.readFile(dest+ '.tgz', 'utf8', function(err,res){
                      if(err){return cb(err)}
                      obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
                      obj.size = res.length;
                      utils.update_feed_cnf(sel, obj, function(err){
                        if(err){return cb(err)}
                        cb(false);
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
  },
  dump_post_csv: function(sel, cb){
    let dest = 'posts';
    if(sel === 'news_dump' || sel === 'news_recent'){
      dest = 'news';
    }
    if(sel === 'gallery_dump'){
      dest = 'gallery';
    }

    db_action.get(dest, function(err,res){
      if(err){return cb(err)}
      let title = 'blog_'+ sel +'.csv',
      obj = {};
      dest = ['./blog/api/feed', sel, title].join('/');
      if(sel === 'post_recent' || sel === 'news_recent'){
        res = res.slice(0, config.feed.recent_count);
      }
      for (let i = 0; i < res.length; i++) {

        res[i].title = encodeURIComponent(res[i].title);

        if(dest !== 'gallery'){
          res[i].body = encodeURIComponent(res[i].body);
          res[i].subtitle = encodeURIComponent(res[i].subtitle);
          res[i].preview = encodeURIComponent(res[i].preview);
        } else {
          res[i].description = encodeURIComponent(res[i].description);
        }

      }

      res = utils.json2csv(res);

      obj.title = title;
      obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
      obj.size = res.length;
      obj.date = Date.now();

      utils.update_feed_cnf(sel, obj, function(err){
        if(err){return cb(err)}
        fs.writeFile(dest, res, function(err){
          if(err){return cb(err)}
          gzip.zip(dest, function(err){
            if(err){return cb('gzip error')}
            archive.create({src: dest, name: title, dest: dest +'.zip', type: 'zip'}, function(err, sz){
              if(err){return cb(err)}
              obj.size = sz;
              obj.title = title + '.zip';
              fs.readFile(dest+ '.zip', 'utf8', function(err,res){
                if(err){return cb(err)}
                obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
                utils.update_feed_cnf(sel, obj, function(err){
                  if(err){return cb(err)}
                  tar.create({name: dest, files: [dest]}, function(err){
                    if(err){return cb(err)}
                    obj.title = title + '.tgz'
                    fs.readFile(dest+ '.tgz', 'utf8', function(err,res){
                      if(err){return cb(err)}
                      obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
                      obj.size = res.length;
                      utils.update_feed_cnf(sel, obj, function(err){
                        if(err){return cb(err)}
                        cb(false);
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
  },
  dump_post_json: function(sel,cb){
    let dest = 'posts';
    if(sel === 'news_dump' || sel === 'news_recent'){
      dest = 'news';
    }
    if(sel === 'gallery_dump'){
      dest = 'gallery';
    }

    db_action.get(dest, function(err,res){
      if(err){return cb(err)}
      let title = 'blog_'+ sel +'.json',
      obj = {};
      dest = ['./blog/api/feed', sel, title].join('/');
      if(sel === 'post_recent' || sel === 'news_recent'){
        res = res.slice(0, config.feed.recent_count);
      }
      res = js(res);

      obj.title = title;
      obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
      obj.size = res.length;
      obj.date = Date.now();

      utils.update_feed_cnf(sel, obj, function(err){
        if(err){return cb(err)}
        fs.writeFile(dest, res, function(err){
          if(err){return cb(err)}
          gzip.zip(dest, function(err){
            if(err){return cb('gzip error')}
            archive.create({src: dest, name: title, dest: dest +'.zip', type: 'zip'}, function(err, sz){
              if(err){return cb(err)}
              obj.size = sz;
              obj.title = title + '.zip';
              fs.readFile(dest+ '.zip', 'utf8', function(err,res){
                if(err){return cb(err)}
                obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
                utils.update_feed_cnf(sel, obj, function(err){
                  if(err){return cb(err)}
                  tar.create({name: dest, files: [dest]}, function(err){
                    if(err){return cb(err)}
                    obj.title = title + '.tgz'
                    fs.readFile(dest+ '.tgz', 'utf8', function(err,res){
                      if(err){return cb(err)}
                      obj.hash = crypto.createHash('sha3-512').update(res).digest('base64');
                      obj.size = res.length;
                      utils.update_feed_cnf(sel, obj, function(err){
                        if(err){return cb(err)}
                        cb(false);
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
  },
  rss_atom_gen: function(item, cb){
    let rss_cnf = JSON.parse(fs.readFileSync('./admin/config/rss_atom_cnf.json', 'utf8')),
    nowUtc = new Date();

    rss_cnf.rss_items[item].pubDate = nowUtc;
    rss_cnf.atom_items[item].updated = nowUtc;

    let rss_arr = [
      '<?xml version="1.0" encoding="UTF-8"?><rss version="'+ rss_cnf.rss_version +'"><channel>',
      utils.rss_base(rss_cnf, item)
    ],
    atom_arr = [
      '<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom">',
      utils.atom_base(rss_cnf, item)
    ]

    db.get(item, function (err, res) {
      if(err){return cb('unable to get '+ item)};
      res = res.slice(0,rss_cnf.recent_length);
      for (let i = 0; i < res.length; i++) {
        rss_arr.push(utils['rss_'+ item +'_item'](res[i]));
        atom_arr.push(utils['atom_'+ item +'_item'](res[i]));
      }
      rss_arr.push('</channel></rss>');
      atom_arr.push('</feed>');
      fs.writeFile('./blog/api/rss/'+ [item,rss_cnf.rss_ext].join('.') , rss_arr.join(''), function(err,res){
        if(err){return cb('unable to update '+ item +' rss feed')}
        fs.writeFile('./blog/api/atom/'+ [item,rss_cnf.atom_ext].join('.'), atom_arr.join(''), function(err,res){
          if(err){return cb('unable to update '+ item +' atom feed')}
          fs.writeFile('./admin/config/rss_atom_cnf.json', js(rss_cnf,0,2), function(err){
            if(err){return cb('unable to update rss_cnf')};
            cb(false)
          })
        });

      });
    })

  },
  rss_atom_cat_gen: function(item, cat, res, dtype, cb){

    if(item === 'post'){
      item+='s';
    }
    console.log(item)
    let rss_cnf = JSON.parse(fs.readFileSync('./admin/config/rss_atom_cnf.json', 'utf8')),
    nowUtc = new Date(),
    rss_dest,
    atom_dest;
    if(dtype === 'author'){
      rss_cnf.rss_items[item].link += '/#/author/'+ cat;
      rss_cnf.atom_items[item].link += '/#/author/'+ cat;
      rss_dest = ['./blog/api/rss/author', item , [cat,rss_cnf.rss_ext].join('.')].join('/');
      atom_dest = ['./blog/api/atom/author', item , [cat,rss_cnf.atom_ext].join('.')].join('/');
    } else {
      rss_cnf.rss_items[item].category = cat;
      rss_cnf.rss_items[item].link += '/#/categories/'+ cat
      rss_cnf.atom_items[item].category = cat;
      rss_cnf.atom_items[item].link += '/#/categories/'+ cat
      rss_dest = ['./blog/api/rss', item , 'category', [cat,rss_cnf.rss_ext].join('.')].join('/');
      atom_dest = ['./blog/api/atom', item , 'category', [cat,rss_cnf.atom_ext].join('.')].join('/');
    }

    rss_cnf.rss_items[item].pubDate = nowUtc;
    rss_cnf.atom_items[item].updated = nowUtc;

    let rss_arr = [
      '<?xml version="1.0" encoding="UTF-8"?><rss version="'+ rss_cnf.rss_version +'"><channel>',
      utils.rss_base(rss_cnf, item)
    ],
    atom_arr = [
      '<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom">',
      utils.atom_base(rss_cnf, item)
    ]

    res = res.slice(0,rss_cnf.recent_length);
    for (let i = 0; i < res.length; i++) {
      rss_arr.push(utils['rss_'+ item +'_item'](res[i]));
      atom_arr.push(utils['atom_'+ item +'_item'](res[i]));
    }
    rss_arr.push('</channel></rss>');
    atom_arr.push('</feed>');
    fs.writeFile(rss_dest , rss_arr.join(''), function(err,res){
      if(err){return cb(['unable to update', item, cat, 'rss feed'].join(' '))}
      fs.writeFile(atom_dest, atom_arr.join(''), function(err,res){
        if(err){return cb(['unable to update', item, cat, 'atom feed'].join(' '))}
        cb(false)
      });
    });

  }
}

/*
db.put('category_post', {}, function (err, val) {
  if(err){console.log(err)}
})
*/
/*
db_action.dump_post_csv('dump' ,function(err){
  if(err){return cl(err)}
  cl('done')
})
*/

/*
db_action.add_gallery({title: 'test image', url: 'via.placeholder.com/360x180'},function(err,res){
  if(err){return cl(err)}
  cl(res)
})
*/
module.exports = db_action;
