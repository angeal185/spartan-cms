import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

var init = function(){
  ss.set('sitemap', appconf.sitemap);

  let s_cnf = ss.get('sitemap');

  function return_input(index, ttl, val, i){
    let readonly = false;
    if(s_cnf.unchange.indexOf(val) !== -1){
      readonly = true;
    }

    return h('div.form-group',
        h('label', ttl),
        h('input.form-control.mb-2', {
          value: val,
          readOnly: readonly,
          'data-id': i,
          onkeyup: function(){
            let sel = parseInt(this.dataset.id);
            s_cnf[index][sel][ttl] = this.value;
            ss.set('sitemap', s_cnf);
            console.log(sel);
          }
        })
      )
  }

  function return_index_item(index, arr, obj, i){
    let item = h('div.card-body',
      h('span.cp.float-right', {
        onclick: function(){
          let arr = [];

          if(index === 'index' && s_cnf.unchange.indexOf(obj.loc) !== -1){
            return utils.toast('danger', 'Bad idea.');
          }

          for (let x = 0; x < s_cnf[index].length; x++) {
            if(x !== i){
              arr.push(s_cnf[index][x])
            }
          }
          s_cnf[index] = arr;
          ws.send({type: 'update_sitemap', data:s_cnf});
        }
      },'delete')
    );

    for (let x = 0; x < arr.length; x++) {
      item.append(return_input(index, arr[x], obj[arr[x]], i))
    }

    return h('div.col-lg-6',
      h('div.card.mb-4',
        item
      )
    )
  }

  let index_row = h('div.row'),
  base_row = index_row.cloneNode(true),
  new_row = index_row.cloneNode(true);

  for (let i = 0; i < s_cnf.index.length; i++) {
    index_row.append(
      return_index_item('index', ['loc', 'lastmod'], s_cnf.index[i], i)
    )
  }

  for (let i = 0; i < s_cnf.base.length; i++) {
    base_row.append(
      return_index_item('base', ['loc', 'lastmod', 'changefreq', 'priority'], s_cnf.base[i], i)
    )
  }

  function add_btn_group(obj, item){
    let btn_div = h('div')

    btn_div.append(h('div',
      h('button.btn.btn-sm.btn-outline-secondary.float-right', {
        type: 'button',
        onclick: function(){
          ws.send({type: 'update_sitemap', data: ss.get('sitemap')});
        }
      }, 'update'),
      h('button.btn.btn-sm.btn-outline-secondary.float-right.mr-2', {
        type: 'button',
        onclick: function(){
          let final = ss.get('sitemap');
          final[item].push(obj);
          ws.send({type: 'update_sitemap', data:final});
        }
      }, 'add new item'),
      h('button.btn.btn-sm.btn-outline-secondary.float-right.mr-2', {
        type: 'button',
        onclick: function(){
          ws.send({type: 'build_sitemap_'+ item, data:ss.get('sitemap')});
        }
      }, 'build sitemap '+ item)

    ))
    return btn_div
  }

  document.getElementById('main-content').append(
    h('div.row',
      h('div.col-6',
        h('h3', 'Sitemap base url'),
        h('div.form-group.mb-4',
          h('input.form-control.mb-2', {
            value: appconf.blog_publish_url,
            readOnly: true
          })
        )
      ),
      h('div.col-6',
      h('h3', 'Date now'),
        h('div.form-group.mb-4',
          h('input.form-control.mb-2', {
            value: utils.lastmod_date(),
            readOnly: true
          })
        )
      )
    ),
    h('h3', 'Sitemap index'),
    index_row,
    add_btn_group({
      loc: '/new.xml',
      lastmod: utils.lastmod_date()
    }, 'index'),
    h('h3', 'Sitemap base'),
    base_row,
    add_btn_group({
      loc: '/#/new_base',
      lastmod: utils.lastmod_date(),
      changefreq: 'weekly',
      priority: '0.5'
    }, 'base', true)
  )

  console.log(utils.lastmod_date())

  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
