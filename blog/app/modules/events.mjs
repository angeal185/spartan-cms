import { global as g } from  "/app/modules/global.mjs";
import { h } from "/app/modules/h.mjs";
import { utils } from "/app/modules/utils.mjs";
import { tpl } from "/app/modules/tpl.mjs";
import { workers } from "/app/modules/workers.mjs";
import { page } from  "/app/modules/page.mjs";
import { idb } from  "/app/modules/idb.mjs";
import { enc } from  "/app/modules/enc.mjs";
import { ls, ss } from  "/app/modules/storage.mjs";
import { cookie_warn, time_line, to_top, scroll_percent, share_block } from "/app/modules/components.mjs";


const events = {
  init: function(config, cb){

    let cnf = {
      link: h('link',{
        rel: 'stylesheet',
        href: ''
      })
    },
    sub_content = h('div#sub-content'),
    body = document.body,
    item;

    idb.get({index: 'cache', id: 'theme'}, function(err,res){
      if(err || !res){
        utils.update_theme(config.theme.base_url, config.theme.base_theme, function(err, data){
          if(err){return g.ce(err)};
          utils.add_theme(data.data, true);
        })
      } else {
        utils.add_theme(res.data, true);
      }

      utils.add_hitcount(config, function(err){
        if(err){g.ce(err)}

        for (let i = 0; i < config.css.length; i++) {
          item = cnf.link.cloneNode(true);
          item.href = './app/css/'+ config.css[i].title + '.css';
          document.head.append(item)
        }

        if(config.to_top){
          sub_content.append(new to_top(config.to_top_dest))
        }

        if(config.scroll_percent){
          sub_content.append(new scroll_percent())
        }

        if(config.cookie_warn && !ls.get('cookie_warn')){
          sub_content.append(new cookie_warn(config.cookie_warn_msg))
        }

        if(config.share_block.enabled){
          sub_content.append(new share_block(config))
        }

        body.append(
          tpl.build(config),
          sub_content
        );

        if(config.sidebar.timeline){
          document.getElementById('timeline').append(new time_line())
        }

        events.toggle_sidebar(config.sb_first);

        if(config.sidebar.catlist){
          workers.fetch_item({type: 'catlist'});
        }

        if(config.sidebar.taglist){
          workers.fetch_item({type: 'taglist'});
        }

        if(config.sidebar.recent){
          workers.fetch_item({type: 'recentlist'});
        }

        if(config.sidebar.history){
          let items = ls.get('history');
          if(items && items.length > 0){
            utils.add_history(items, 'his');
          }
        }

        if(config.sidebar.history){
          let items = ls.get('favorite');
          if(items && items.length > 0){
            utils.add_history(items, 'fav');
          }
        }

        cb(false);
      })
    })

  },
  rout: function(config, cb){
    try {

      window.onhashchange = function(){
          g.cl('hit')
        events.rerout(config);
      }

      if(location.hash !== ''){
        events.rerout(config);
      } else {
        location.hash = '/' + config.navlinks[0];
      }

      return cb(false)
    } catch (err) {
      if(err){return cb(err)};
    }
  },
  rerout: function(config){
      let dest = location.hash.slice(2).split('/'),
      main = document.getElementById('main-content'),
      bcdest = '';

      if(dest[0] !== config.navlinks[0]){
        bcdest = dest[0]
      }

      document.getElementById('bc').innerText = bcdest;
      main.innerHTML = '';
      document.title = dest[0];
      ls.set('path', dest)
      try {
      page[dest[0]](main, function(cnf){
        events.trigger('sidebar', cnf.sidebar);
      });
    } catch (err) {
      if(err){
        g.ce(err)
        location.hash = '/error'
        return g.ce('page not found')
      }
    }
  },
  toggle_sidebar: function(i){
    ss.set('sidebar', false);
    let sib = 'previousSibling';
    if(!i){
      sib = 'nextSibling';
    }
    window.addEventListener('sidebar', function(evt){
      evt = evt.detail;
      let item = document.getElementById('main-content');
      if(!evt){
        if(ss.get('sidebar') !== false) {
          item.classList.remove('col-lg-9');
          item.classList.add('col-lg-12')
          item[sib].classList.add('hidden');
          ss.set('sidebar', false);
        }
      } else {
        if(ss.get('sidebar') !== true) {
          item.classList.remove('col-lg-12');
          item.classList.add('col-lg-9')
          item[sib].classList.remove('hidden');
          ss.set('sidebar', true);
        }
      }
    })
  },
  trigger: function(evt, data){
    var event = new CustomEvent(evt, {
      detail: data
    });
    window.dispatchEvent(event);
    return;
  },
  remove_botnet: function(i){
    if(i.remove){
      setTimeout(function(){
        document.getElementById('botnet').remove();
      }, i.delay)
    }
  }
}

export { events }
