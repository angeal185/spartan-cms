import { global as g } from  "/modules/global.mjs";
import { h } from  "/modules/h.mjs";
import { ws } from  "/modules/ws.mjs";
import { ls,ss } from  "/modules/storage.mjs";

import '/modules/Sortable.mjs';
import "/js/prism/prism.js"
import "/modules/beautify/beautify-js.js"
import "/modules/beautify/beautify-html.js"
import "/modules/beautify/beautify-css.js"

const utils = {
  mload: {
    add: function(i){
      i.setAttribute('disabled', true);
      i.append(h('span.spinner-grow.ml-2'));
      return;
    },
    del: function(i, e){
      i.removeAttribute('disabled', true);
      i.innerHTML = e;
      return;
    }
  },
  empty: function(i){
    while (i.firstChild) {
      i.removeChild(i.firstChild);
    }
  },
  get_year: function(i){
    let year = new Date(i);
    year = year.getFullYear();
    return JSON.stringify(year);
  },
  snake_case: function(i){
    return i.replace(/ /g, /_/);
  },
  min: {
    js: function(code){
      ws.send({
        type: 'min_js',
        data: code
      })
    },
    css: function(code){
      ws.send({
        type: 'min_css',
        data: code
      })
    },
    json: function(code){
      try {
        let data =  g.js(g.jp(code));
        let event = new CustomEvent('min_json', {
          detail: data
        });
        window.dispatchEvent(event);
      } catch (err) {
        if(err){
          utils.toast('danger', 'minify error, check your code');
          return null;
        }
      }
    }
  },
  max: {
    js: function(code){
      try {
        return js_beautify(code);
      } catch (err) {
        if(err){
          utils.toast('danger', 'beautify error, check your code');
          return null;
        }
      }
    },
    css: function(code){
      try {
        return css_beautify(code);
      } catch (err) {
        if(err){
          utils.toast('danger', 'beautify error, check your code');
          return null;
        }
      }
    },
    json: function(code){
      try {
        return g.js(g.jp(code),0,2);
      } catch (err) {
        if(err){
          utils.toast('danger', 'beautify error, check your code');
          return null;
        }
      }
    },
    html: function(code){
      try {
        return html_beautify(code);
      } catch (err) {
        if(err){
          utils.toast('danger', 'beautify error, check your code');
          return null;
        }
      }
    }
  },
  clear: function(i){
    let div = document.getElementById(i);
    while(div.firstChild){
        div.removeChild(div.firstChild);
    }
  },
  chunk: function(arr, x){
    let newarr = [];
    for (var i=0;i<Math.ceil(arr.length/x);i++) {
      newarr.push(arr.slice(i*x,i*x+x));
    }
    return newarr;
  },
  update_alert: function(arr){
    let dest = document.getElementById("dd-alerts"),
    item = h('#alerts');

    if(arr.length > 5){
      arr = arr.slice(0,5)
    }

    for (let i = 0; i < arr.length; i++) {
      item.append(
        h('div.dropdown-item',
          h('div.row',
            h('div.col-4.cent',
              h('h3.fas.fab.fa-info-circle.text-gray-500')
            ),
            h('div.col-8',
              h('h6.pt-3', arr[i].msg),
              h('p.text-gray-500', utils.ts2datetime(arr[i].date))
            )
          )
        )
      )
    }
    return dest.replaceChild(item, dest.childNodes[1]);
  },
  add_alert: function(i){
    let items;
    if(!ls.get('alerts') || typeof ls.get('alerts') !== 'object'){
      items = [];
    } else {
      items = ls.get('alerts');
    }
    items.unshift({date: Date.now(), msg: i});
    ls.set('alerts', items);
    utils.update_alert(items);
  },
  confirm: function(data, cb){
    let item = h('div#confirm.mask.text-center',
      h('div.card.w-50',
        h('div.card-body',
          h('p', data),
          h('button.btn.btn-outline-secondary.mr-4',{
            type: 'button',
            onclick: function(){
              cb(true)
              document.getElementById('confirm').remove();
            }
          }, 'confirm'),
          h('button.btn.btn-outline-secondary',{
            type: 'button',
            onclick: function(){
              cb(false)
              document.getElementById('confirm').remove();
            }
          }, 'cancel')
        )
      )
    )
    document.body.append(item);
  },
  prompt: function(data, cb){
    let item = h('div#confirm.mask.text-center',
      h('div.card.w-50',
        h('div.card-body',
          h('div.form-group',
            h('label', data),
            h('input.form-control', {
              type: 'text'
            })
          ),
          h('button.btn.btn-outline-secondary.mr-4',{
            type: 'button',
            onclick: function(){
              let result = this.previousSibling.lastChild.value;
              if(result === ''){
                return utils.toast('danger', 'input cannot be empty');
              }
              cb(result);
              document.getElementById('confirm').remove();
            }
          }, 'confirm'),
          h('button.btn.btn-outline-secondary',{
            type: 'button',
            onclick: function(){
              cb(false)
              document.getElementById('confirm').remove();
            }
          }, 'cancel')
        )
      )
    )
    document.body.append(item);
  },
  toast: function(i, msg){
    const toast = h('div#toast.alert.alert-'+ i, {
        role: "alert"
    }, msg);
    document.body.append(toast);
    setTimeout(function(){
      toast.classList.add('fadeout');
      setTimeout(function(){
        toast.remove();
      },1000)
    },3000)
    return;
  },
  getJson: function(url, cb){
    fetch('/'+ url + '.json', {
      method: 'GET', // or 'PUT'
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      cb(false, data);
    })
    .catch(function(err){
      cb(err)
    })
  },
  capitalize: function(i) {
    return i.charAt(0).toUpperCase() + i.slice(1);
  },
  toggle_editor: function(i){
    document.getElementById(i[0]+'-toggle').addEventListener('click', function(){
      document.getElementById(i[1]+'-div').classList.add('hidden');
      document.getElementById(i[0]+'-div').classList.remove('hidden');
    })
  },
  debounce: function(func, wait, immediate) {
  	var timeout;
  	return function() {
  		var context = this, args = arguments;
  		var later = function() {
  			timeout = null;
  			if (!immediate) func.apply(context, args);
  		};
  		var callNow = immediate && !timeout;
  		clearTimeout(timeout);
  		timeout = setTimeout(later, wait);
  		if (callNow) func.apply(context, args);
  	};
  },
  valid_json: function(i){
    try {
      let data = g.js(g.jp(i));
      return;
    } catch (err) {
      if(err){return utils.toast('danger', 'error in data');}
    }
  },
  nav_toggle: function(){
    let navlnk = document.getElementsByClassName('nav-link');

    for (let i = 0; i < navlnk.length; i++) {
      navlnk[i].addEventListener('click', function(){
        let target = navlnk[i].getAttribute('data-target');

        navlnk[i].classList.toggle('collapsed');
        if( navlnk[i].hasAttribute("data-toggle","collapse")){
          document.getElementById(target).classList.toggle('show');
        }

      })
    }
  },
  totop: function(i){
    window.scroll({
      top: i,
      left: 0,
      behavior: 'smooth'
    });
  },
  sb_toggle: function(){
    document.getElementById('sidebarToggleTop').addEventListener('click', function(){
      document.body.classList.toggle('sidebar-toggled');
      document.getElementsByClassName('sidebar')[0].classList.toggle('toggled');
    })
  },
  fullScreen_toggle: function(elem) {

    if ((document.fullScreenElement !== undefined && document.fullScreenElement === null) || (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) || (document.mozFullScreen !== undefined && !document.mozFullScreen) || (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen)) {
        if (elem.requestFullScreen) {
            elem.requestFullScreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
  },
  ts2datetime: function(i){
    return new Date(i).toLocaleString()
  },
  toTop: function(){
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  },
  update_final: function(i){
    let code = g.js(ls.get(i), 0, 2)
    code = Prism.highlight(code, Prism.languages.json, 'json');
    document.getElementById('post_final').innerHTML = code
  },
  update_post: function(i, key, val){
    try {
      let obj = ls.get(i);
      obj[key] = val
      ls.set(i, obj);
    } catch (err) {
      if(err){return g.ce('unable to update '+ i +' data')}
    }
  },
  page_mode: function(x){
    let arr = ['html', 'javascript'],
    pmode = document.getElementById('page_mode');
    for (let i = 0; i < arr.length; i++) {
      if(pmode.value !== x){
        document.getElementById(arr[i]+ '_div').classList.toggle('hidden')
      }
    }
    if(pmode.value !== x){
      pmode.value = x;
      ss.set('page_mode', x)
    }
  },
  update_page_final: function(){
    let code = ss.get('page_final');
    code = Prism.highlight(js_beautify(code), Prism.languages['javascript'], 'javascript');
    document.getElementById('page_final').innerHTML = code
  },
  update_import_final: function(){
    let code = ss.get('import_final'),
    str = '';

    for (let i = 0; i < code.length; i++) {
      str+='import { '+ code[i].name +' } from "'+ code[i].url +'";\n';
    }

    code = Prism.highlight(str, Prism.languages.javascript, 'javascript');

    document.getElementById('import-final').innerHTML = code
  },
  update_base_final: function(code){
    code = Prism.highlight(code, Prism.languages.html, 'html');
    document.getElementById('base-final').innerHTML = code
  },
  build_base_html: function(obj){
    return "<!DOCTYPE html><html><head>"+ obj.meta + obj.css + obj.js_top +"<script type='application/ld+json'>"+ g.js(appconf.jsonld.base) +"</script></head><body>"+ obj.body +"</body></html>";
  },
  return_page_js: function(i){
    let title = ss.get('page_title');
    if(ss.get('page_mode') === 'html'){
      i = i[0] + 'document.getElementById("main-content").innerHTML = '+ g.js(i[1]);
    }
    return 'const pages = {\n  '+ title+ ': function(main, cnf){\n\n'+ i +'\n\n  }\n}'
  },
  nav_sort: function(ele){

    new Sortable(ele, {
        handle: '.handle',
        animation: 150,
        onSort: function (/**Event*/evt) {
          let items = document.getElementsByClassName('handled'),
          arr = []
          for (let i = 0; i < items.length; i++) {
            arr.push(items[i].innerText);
          }
          return ws.send({type: 'update_page_order', data: arr})
      	}
    });
  },
  api_sort: function(ele){

    new Sortable(ele, {
        handle: '.handle',
        animation: 150,
        onSort: function (/**Event*/evt) {
          utils.update_api_data()
      	}
    });
  },
  update_api_data: function(){
    let api_url = document.getElementsByClassName('api-url'),
    api_example = document.getElementsByClassName('api-example'),
    api_description = document.getElementsByClassName('api-description'),
    obj = {},
    arr = []

    for (let i = 0; i < api_url.length; i++) {
      obj.url = api_url[i].value;
      obj.example = api_example[i].value;
      obj.description = api_description[i].value;
      arr.push(obj);
      obj = {};
    }
    obj = null;
    return ws.send({type: 'update_api_data', data: arr})
  },
  return_api_item: function(obj){
    let item = h('div.list-group-item',
      h('div.row',
        h('div.col-lg-1',
          h('div.fas.fa-bars.handle.lh-25')
        ),
        h('div.col-lg-3',
          h('div.form-group',
            h('input.form-control.api-url', {
              type: 'text',
              title: 'api url',
              value: obj.url,
              onkeyup: utils.debounce(function(){
                utils.update_api_data();
              }, 1000)
            })
          )
        ),
        h('div.col-lg-3',
          h('div.form-group',
            h('input.form-control.api-example', {
              type: 'text',
              title: 'api example',
              value: obj.example,
              onkeyup: utils.debounce(function(){
                utils.update_api_data();
              }, 1000)
            })
          )
        ),
        h('div.col-lg-4',
          h('div.form-group',
            h('input.form-control.api-description', {
              value: obj.description,
              title: 'api description',
              onkeyup: utils.debounce(function(){
                utils.update_api_data();
              }, 1000)
            })
          )
        ),
        h('div.col-lg-1',
          h('button.btn.btn-outline-danger.btn-sm.float-right', {
            onclick: function(){
              item.remove();
              utils.update_api_data();
            }
          },'Delete')
        )
      )
    )

    return item;

  },
  import_sort: function(ele){
    new Sortable(ele, {
        handle: '.handle',
        animation: 150,
        onSort: function (evt) {

          let arr = [],
          names = document.getElementsByClassName('import-name'),
          urls = document.getElementsByClassName('import-url');
          for (let i = 0; i < names.length; i++) {
            arr.push({name: names[i].value, url: urls[i].value})
          }
          ws.send({type: 'update_import_order', data: arr})
          ss.set('import_final', arr);
          return utils.update_import_final();
      	}
    });
  },
  import_item: function(obj){
    let delbtn = '';
    if(obj.name !== 'h' && obj.name !== 'events'){
      delbtn = h('div.form-group',
        h('label', 'option'),
        h('button.btn.btn-outline-danger.form-control.btn-sm',{
          type: 'button',
          onclick: function(){
            let items = ss.get('import_final'),
            arr = [];

            for (let i = 0; i < items.length; i++) {
              if(items[i].name !== obj.name){
                arr.push(items[i]);
              }
            }

            ss.set('import_final', arr);
            this.parentNode.parentNode.parentNode.parentNode.remove();
            ws.send({type: 'update_import_order', data: arr})
            utils.update_import_final()

          }
        }, 'Delete')
      )
    }

    const item = h('div.list-group-item',
      h('div.row',
        h('div.form-group.col-1.imp',
          h('i.fas.fa-bars.handle')
        ),
        h('div.form-group.col-4',
          h('label', 'import'),
          h('input.form-control.import-name', {
            type: 'text',
            value: obj.name,
            readOnly: true
          }),
        ),
        h('div.form-group.col-4',
          h('label', 'url'),
          h('input.form-control.import-url', {
            type: 'text',
            value: obj.url,
            readOnly: true
          })
        ),
        h('div.col-3', delbtn)
      )
    )

    return item;
  },
  update_new_import: function(key,val){
    let item = ss.get('import_new');
    item[key] = val;
    ss.set('import_new', item)
  },
  set_footer: function(){

  },
  addCSS(i){
    return document.head.append(
        h('link',{
          rel: 'stylesheet',
          href: '/css/'+ i +'.css'
        })
      )
  },
  readFile: function(evt, cb){
    let input = evt.target,
    reader = new FileReader();
    reader.onload = function(){
      try {
        cb(false, g.jp(reader.result))
      } catch (err) {
        if(err){return cb(true)}
      }
    };
    reader.readAsText(input.files[0]);
  },
  totop_init: function(){
    document.getElementById('wrapper').append(
      h('div#totop.fas.fa-angle-up.sh-95',{
        onclick: function(){
          utils.toTop();
        }
      })
    )
  },
  globe_change: function(item, status){
    let dest = document.getElementById('globe-'+ item);
    if(status === 'online'){
      dest.title = item +' server online';
      dest.classList.remove('reloading');
      dest.classList.add('online');
    } else if (status === 'reloading'){
      dest.title = item +' server reloading';
      dest.classList.remove('online');
      dest.classList.add('reloading')
    } else {
      dest.title = item +' server offline';
      dest.classList.remove('online', 'online')
    }
  },
  is_offline: function(dest){
    dest.title = 'internet offline';
    dest.classList.remove('online');
    dest.classList.add('offline');
  },
  is_online: function(dest){
    dest.title =  'internet online';
    dest.classList.remove('offline');
    dest.classList.add('online');
  },
  init_online_status: function(obj){
    let globe_div = document.getElementById('globe-div'),
    globe_item = h('span.globe'),
    new_globe, stat;

    for (let key in obj) {
      new_globe = globe_item.cloneNode(true);
      if(obj[key] === true){
        stat = 'online'
      } else {
        stat = 'offline'
      }
      new_globe.classList.add(stat)
      new_globe.title = key.replace('_', ' ') +' server '+ stat;
      globe_div.append(new_globe)
    }

  },
  init_status_bar: function(){
    let dest = document.getElementById('footer'),
    globe_div = h('div#globe-div.col-6'),
    globe_item = h('span.globe'),
    online_globe = globe_item.cloneNode(),
    new_globe,
    globe_obj = {};

    if(navigator.onLine){
      utils.is_online(online_globe);
    } else {
      utils.is_offline(online_globe);
    }

    window.addEventListener('online',  function(){
      utils.is_online(online_globe);
    })

    window.addEventListener('offline',  function(){
      utils.is_offline(online_globe);
    })

    globe_div.append(online_globe)

    new_globe = globe_item.cloneNode(true);
    new_globe.id = 'globe-wss';
    new_globe.title = 'wss server offline';
    globe_div.append(new_globe)


    dest.append(
      h('div#status_bar',
        h('div.row',
          h('div.col-6',

          ),
          globe_div
        )
      )
    )

    dest.parentNode.append(
      h('div#server_bar',
        h('div#server_toggle.fa.fa-server', {
          onclick: function(){
            this.parentNode.classList.toggle('show')
          }
        }),
        h('div.card-body',
          h('div.card-body')
        )
      )
    )


    let ols = setInterval(function(){
      if(ss.get('wss_conn')){
        ws.send({type: 'online_status'});
        clearInterval(ols);
      }
    },1000)

  },
  init_admin: function(){
    utils.nav_toggle();
    utils.sb_toggle();
    utils.update_alert(ls.get('alerts') || []);
    utils.totop_init();
    utils.init_status_bar();
    document.getElementById('fullscreen').addEventListener("click", function(){
      utils.fullScreen_toggle(document.body)
    });
    document.getElementById('logoutLnk').addEventListener("click", function(){
      utils.logout();
    });
    utils.init_quicknav()

  },
  get_ext: function(x){
     let i = x.lastIndexOf('.');
     if(i === -1 ){
       return false;
     }
     return x.slice(i)
   },
   del_cookie: function(name) {
     try {
       return document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
     } catch (err) {
       if(err){return utils.toast('danger', 'unable to delete user auth token')}
     }
  },
  logout: function(){

    fetch('/logout', {
      method: 'POST',
      mode: 'same-origin',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      referrer: 'no-referrer'
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      if(data.code === 0){
        ls.del('jwt');
        utils.delete_cookie('token');
        utils.toast('success', data.msg)
        setTimeout(function(){
          location.href = '/login'
        },3000)
      } else {
        return utils.toast('danger', data.msg)
      }
      return
    })
  },
  append_feed_item: function(feedarr, obj, feedcnf){
    let item = h('option'),
    title = 'blog_'+ obj.type +'.' + feedarr;
    if(obj.ext){
      title+= '.' +obj.ext
    }
    item.value = title;
    item.innerText = title;
    item.onclick = function(){
      ss.set(obj.type + '_feed', feedarr);
      let dest = ['.', 'blog', 'api/feed/'+ obj.type, this.value].join('/');
      document.getElementById('blog_'+ obj.type +'_url').value = dest;
      for (let i = 0; i < feedcnf[obj.type].length; i++) {
        if(feedcnf[obj.type][i].title === this.value){
          for (let val in feedcnf[obj.type][i]) {
            if(val === 'date'){
              document.getElementById('blog_'+ obj.type +'_'+ val).value = utils.ts2datetime(feedcnf[obj.type][i][val])
            } else if(val === 'size'){
              document.getElementById('blog_'+ obj.type +'_'+ val).value = utils.formatBytes(feedcnf[obj.type][i][val], 3);
            } else if(val !== 'title'){
              document.getElementById('blog_'+ obj.type +'_'+ val).value = feedcnf[obj.type][i][val];
            }
          }
        }
      }
    }
    return item;
  },
  formatBytes: function(bytes, decimals) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
  update_timespan: function(res, i){
    if(res !== ''){
      ws.send({
        type: 'feed_timespan',
        data: {
          type: i,
          val: res
        }
      });
    }
  },
  delete_cookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  },
  lastmod_date: function(){
    let date = new Date(Date.now()),
    dd = date.getDate(),
    mm = date.getMonth()+1,
    yyyy = date.getFullYear();

    if(dd < 10){
      dd = '0' + dd
    }
    if(mm < 10){
      mm = '0' + mm
    };
    return [yyyy, mm, dd].join('-')
  },
  init_quicknav: function(){

    if(appconf.shortcut.enabled){

      let trig_lnks = appconf.shortcut.items,
      trig_nav = h('div.bouncy-nav'),
      trig_menu = h('div.bouncy-nav-modal',
          trig_nav
      ),
      trig_item = h('div', h('span.fas'),h('small')),
      trig_btn = h('div.bouncy-nav-trigger.fas.fa-bolt.sh-95',{
        onclick:function(){
          this.classList.add('hidden')
          return triggerBouncyNav(true);
        }
      }),
      item;

      trig_menu.onclick = function(){
        triggerBouncyNav(false);
        trig_btn.classList.remove('hidden');
      }

      for (let i = 0; i < trig_lnks.length; i++) {
        item = trig_item.cloneNode(true);
        item.lastChild.innerText = trig_lnks[i].title
        item.onclick = function(){
          triggerBouncyNav(false);
          trig_btn.classList.remove('hidden');
          return location.href = trig_lnks[i].dest;
        }
        trig_nav.append(item);
        item = null;
      }

      let is_bouncy_nav_animating = false;
      function triggerBouncyNav($bool) {
        if (!is_bouncy_nav_animating) {
          is_bouncy_nav_animating = true;
          trig_menu.classList.toggle('fade-in', $bool)
          trig_menu.classList.toggle('fade-out', !$bool)
          setTimeout(function(){
            trig_menu.classList.toggle('is-visible', $bool);
            if(!$bool){
              trig_menu.classList.remove('fade-out');
            }
            is_bouncy_nav_animating = false;
          },1000)
        }
      };

      document.getElementById('wrapper').append(
        trig_btn,
        trig_menu
      )
    }


  }
}

export { utils }
