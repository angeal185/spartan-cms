import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

var init = function(){
  ss.set('spartan_rss_atom', appconf.rss);
  let row_item,
  row_sub,
  row_sub_row,
  rss_main = h('div',
    h('h3', 'RSS '+ appconf.rss.rss_version,
      h('small.float-right', 'feed settings')
    )
  ),
  atom_main = h('div',
    h('h3', 'Atom',
      h('small.float-right', 'feed settings')
    )
  )

  function return_row(i){
    return h('div.row',
      h('div.col-12',
        h('h5', i)
      )
    )
  }

  function return_input(item, obj){
    return h('div.col-6',
      h('div.form-group.mb-2',
        h('label', obj.title),
        h('input.form-control', {
          type: 'text',
          value: obj.value,
          onkeyup: utils.debounce(function(){
            let cnf = ss.get('spartan_rss_atom');
            if(!obj.sub){
              cnf[item +'_items'][obj.type][obj.title] = this.value;
            } else {
              cnf[item +'_items'][obj.type][obj.sub][obj.title] = this.value;
            }
            ss.set('spartan_rss_atom', cnf);
            ws.send({type: 'rss_atom_cnf_update', data: cnf});
          },3000)
        })
      )
    )
  }

  let rss_feeds = appconf.rss.rss_items,
  atom_feeds = appconf.rss.atom_items;

  for (let val in rss_feeds) {
    row_item = return_row(val)
    for (let item in rss_feeds[val]){
      if(item === 'image' || item === 'skipHours'){
        row_sub = h('div.col-12.mb-4.mt-4',
          h('h6', item)
        );
        row_sub_row = h('div.row');
        for (let key in rss_feeds[val][item]){
          row_sub_row.append(return_input('rss', {type: val, title: key, value: rss_feeds[val][item][key], sub: item}))
        }
        row_sub.append(row_sub_row)
        row_item.append(row_sub)

      } else if(item !== 'lastBuildDate' && item !== 'pubDate' && item !== 'generator'){
        row_item.append(return_input('rss', {type: val, title: item, value: rss_feeds[val][item]}))
      }
    }
    rss_main.append(row_item, h('hr.col-12.mb-4.mt-4'))
  }

  for (let val in atom_feeds) {
    row_item = return_row(val)
    for (let item in atom_feeds[val]){
      if(item === 'author'){
        row_sub = h('div.col-12.mb-4.mt-4',
          h('h6', item)
        );
        row_sub_row = h('div.row');
        for (let key in atom_feeds[val][item]){
          row_sub_row.append(return_input('atom', {type: val, title: key, value: atom_feeds[val][item][key], sub: item}))
        }
        row_sub.append(row_sub_row)
        row_item.append(row_sub)

      } else if(item !== 'updated' && item !== 'generator'){
        row_item.append(return_input('atom', {type: val, title: item, value: atom_feeds[val][item]}))
      }
    }
    atom_main.append(row_item, h('hr.col-12.mb-4.mt-4'))
  }


  document.getElementById('main-content').append(rss_main, atom_main);

  //ws.send({type: 'feed_data'});
  window.removeEventListener('socket_ready', init, false);

}


window.addEventListener('socket_ready', init, false);
