import { global as g } from  "/app/modules/global.mjs";
import { bs,ls,ss } from "/app/modules/storage.mjs";
import { h } from "/app/modules/h.mjs";

if(!chrome || typeof chrome === undefined){
  chrome = browser;
}

const utils = {
  is_online: function(cb){
    let i = navigator.onLine ? "online" : "offline";
    if(i === 'online'){
      return cb(true)
    }
    return cb(false);
  },
  totop: function(i){
    window.scroll({
      top: i,
      left: 0,
      behavior: 'smooth'
    });
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
  to_top: function(i){

    let item = h('div.to-top.hidden.sh-9', {
        onclick: function(){
          utils.totop(i);
        }
      },
      h('i.icon-up-open')
    );

    window.addEventListener('scroll', utils.debounce(function(evt){
      let top = window.pageYOffset || document.scrollTop;

      if(top === NaN || !top){
        item.classList.add('hidden')
      } else if(item.classList.contains('hidden')){
        item.classList.remove('hidden');
      }
      top = null;
      return;
    }, 250))

    return item;
  },
  get_year: function(){
    let d = new Date();
    return d.getFullYear();
  },
  return_footer: function(config){
    const cmsg = config.copyright.replace('{{year}}', utils.get_year());
    return h('footer.text-center.mt-4',
      h('small.cp', {
        onclick: function(){
          window.open(config.base_url)
        }
      },cmsg),
      utils.return_social(config.social)
    )
  },
  capitalize: function(str) {
   try {
     let x = str[0] || str.charAt(0);
     return x  ? x.toUpperCase() + str.substr(1) : '';
   } catch (err) {
     if(err){return str;}
   }
  },
  empty: function(div){
    while(div.firstChild){
      div.removeChild(div.firstChild);
    }
  },
  config_check: function(cb){
    bs.get('config', function(err,res){
      if(!err || !res.version){
        console.log('fetching config data...');
        utils.get('/app/config/index.json', function(err,res){
          if(err){return console.log(err)}
          bs.set({config:  res}, function(err){
            if(err){return console.log(err)}
            bs.set({subscribed:  ['posts', 'news']}, function(err){
              if(err){return console.log(err)}
              cb(res)
            })
          })
        })
      } else {
        console.log('config data found');
        cb(res)
      }
    })
  },
  return_nav: function(config, title){

    return h('nav.navbar.navbar-light.bg-light.mb-4',
      h('a.navbar-brand',{
          href: config.base_url,
          target: '_blank'
        },
        h('img.mr-2',{
          src: config.base_logo
        }),
        title.replace('_', ' ')
      ),
      h('span.icon-cog-alt.mr-2.opt-ico', {
        onclick: function(){
          window.open('/app/config.html')
        }
      })
    )
  },
  rout: function(i){
    ls.set('rout', i);
    chrome.tabs.create({url: "/app/main.html"});
  },
  list_item: function(i, e, len, col, isCat){
    console.log(isCat)
    return h('div.list-group-item.cp.mainlink', {
        onclick: function(){
          ls.set('isCat', isCat);
          utils.rout(e)
        }
      },
      h('span',{
        title: "view " + i,
      },i),
      h('span.icon-right-open.float-right.mr-2'),
      h('span.badge.badge-'+ col +'.float-right.mr-2.pcount', len)
    )
  },
  ts2datetime: function(i){
    return new Date(i).toLocaleString()
  },
  postsByDate: function(i){
    let src = new Date(i).toDateString().toLowerCase().split(' ').slice(1)
    src = ['#', 'post', src[2], src[0], i].join('/')
    return src;
  },
  newsByDate: function(i){
    let src = new Date(i).toDateString().toLowerCase().split(' ').slice(1)
    src = ['#', 'entries', src[2], i].join('/')
    return src;
  },
  build_items: function(len, rout, cb){
    bs.get('config', function(err, config){
      if(err){return cb(err)}
      let feed_row = h('div.row'),
      isCat = ls.get('isCat'),
      src = config.base_url + config.urls[rout] + len + '.json';

      if(typeof isCat === 'string'){
        src = config.base_url + config.urls[rout] +isCat +'/' + len + '.json';
      }

      console.log(src)
      utils.get(src, function(err,res){
        if(err){return g.cl(err);}

        let frout = rout.split('_')[0];
        for (let i = 0; i < res.length; i++) {
          res[i].catlink = config.base_url + config.urls[frout +'_cat'] + res[i].category;
          res[i].link = config.base_url + utils[frout+ 'ByDate'](res[i].date);
          res[i].authorlink = config.base_url + config.urls.author + res[i].author;
          feed_row.append(utils.return_item(res[i]))
        }

        if(typeof isCat === 'string'){
          src = config.base_url + config.urls[rout] +isCat +'/index.json';
          utils.get(src, function(err, res){
            if(err){return g.cl(err)}
            ls.set(rout + '_pag', res);
            cb(false, feed_row);
          })
        } else {
          cb(false, feed_row)
        }
      })
    })
  },
  return_item: function(obj){
    return h('div.col-lg-6',
      h('div.card.mt-2.mb-2',
        h('div.card-body',
          h('div.media.mt-4.mb-4',
            h('img', {src: '/app/images/lg_48.png'}),
            h('div.media-body',
              h('h5', obj.title),
              h('h6', obj.subtitle),
              h('p', obj.preview),
              h('a.icon-user.mr-2', {
                title: 'Author',
                href: obj.authorlink,
                target: '_blank'
              }, obj.author),
              h('a.icon-tag.mr-2', {
                title: 'Category',
                href: obj.catlink,
                target: '_blank'
              }, obj.category),
              h('a.icon-link.mr-2', {
                title: obj.link,
                href: obj.link,
                target: '_blank'
              }, 'Link'),
              h('span',
                h('i.icon-calendar', {
                  title: 'Date'
                }),
                utils.ts2datetime(obj.date)
              )
            )
          )
        )
      )
    )
  },
  get: function(src, cb){
    fetch(src, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {
      return cb(false, data);
    })
    .catch(function(err){
      cb(err);
    })
  },
  get_theme: function(cb){

    bs.get('theme', function(err, res){
      if(err){return cb(err)}
      let data = new Blob([res.data], {type : 'text/css; charset=utf-8'});
      let themeURL = URL.createObjectURL(data);
      document.getElementById('theme').href = themeURL;
      return cb(false, res.title);
    })

  },
  set_theme: function(src, title, cb){

    fetch(src, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/css',
        'Sec-Fetch-Dest': 'style',
        'Sec-Fetch-mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    })
    .then(function(res){
      if (res.status >= 200 && res.status < 300) {
        return res.text();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {

      bs.set({theme:  {title: title, data: data}}, function(err){
        if(err){return cb(err)}
        return cb(false);
      })

    })
    .catch(function(err){
      cb(err);
    })
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
  return_social: function(social){
    let sdiv = h('div#social')
    for (let i = 0; i < social.length; i++) {
      sdiv.append(
        h('span.sh-9.cp.'+social[i].ico, {
          title: social[i].title,
          onclick: function(){
            window.open(social[i].url)
          }
        })
      )
    }
    return sdiv;
  },
  return_input: function(i,e){
      return h('div.col-lg-6',
        h('div.form-group',
          h('label', i),
          h('input.form-control', {
            value: e,
            readOnly: true
          })
        )
      )
  },
  return_btn: function(title, func){
    return h('button.btn.btn-outline-secondary.btn-sm.float-right',{
      onclick: func
    }, title)
  },
  version_check: function(current,latest){
    let x = current.split('.'),
    y = latest.split('.');
    for (let i = 0; i < 3; i++) {
      if(parseInt(y[i]) > parseInt(x[i])){
        ls.set('latest_version', latest)
        return latest;
      }
    }
    ls.set('latest_version', current)
    return false
  }
}

export { utils };
