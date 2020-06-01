import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { enc } from  "/modules/enc.mjs";
import { ss } from  "/modules/storage.mjs";
import { pagination } from  "/modules/pagination.mjs";


var init = function(){

  ss.set('pagtype', 'subscribers')

  window.addEventListener("subscribers_list", function(evt) {
    evt = evt.detail;

    let main = document.getElementById('main-content'),
    main_wrap = h('div.container-fluid'),
    row_main = h('div.row'),
    item = h('ul.pagination'),
    arr = ['name', 'email', 'date'],
    pagitems = utils.chunk(evt, 100) || [],
    max = pagitems.length,
    sync_btn = h('button.btn.btn-outline-info.btn-sm.mr-2.mt-2.float-right',{
      type: 'button',
      title: 'sync with database',
      onclick: function(event){
        utils.mload.add(event.target);
        fetch('/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip',
            'Sec-Fetch-Dest': 'object',
            'Sec-Fetch-mode': 'same-origin',
            'Sec-Fetch-Site': 'same-origin'
          },
          body: g.js({
            dest: 'subscribed'
          })
        }).then(function(res) {
          if (res.status >= 200 && res.status < 300) {
            return res.json();
          } else {
            return Promise.reject(new Error(res.statusText))
          }
        }).then(function(data) {
          if(!data.error){
            if(data.length < 1){
              return ws.send({type: 'subscribers_update', data: []});
            }

            for (let i = 0; i < data.length; i++) {
              enc.rsa_oaep_dec(appconf.privateKey, {data: enc.hex2u8(data[i].data), sha: '512'}, function(err,ptext){
                if(err){
                  g.ce(err);
                  g.ce('subscriber decrypt failure:'+ g.js(data[i]));
                  utils.toast('danger', 'subscribers item '+ i +' failed to decrypt')
                } else {
                  data[i].data = g.jp(ptext);
                  data[i].name = data[i].data.name;
                  data[i].email = data[i].data.email;
                  delete data[i].data;
                }

                if(i === (data.length -1)){
                  return ws.send({type: 'subscribers_update', data: data});
                }
              })
            }
          } else {
            utils.mload.del(event.target, 'Sync');
            return utils.toast('danger', data.msg);
          }

        }).catch(function(err) {
          g.cl('Request failed', err);
          utils.mload.del(event.target, 'Sync');
          return utils.toast('danger', 'subscribers update failed');
        });

      }
    }, 'Sync');

    for (let i = 0; i < arr.length; i++) {
      row_main.append(h('div.col-3', arr[i]))
    }

    row_main.append(
      h('div.col-3',
        h('button.btn.btn-outline-danger.btn-sm.float-right.mt-2',{
          type: 'button',
          title: 'reset database',
          onclick: function(event){
            utils.mload.add(event.target);
            utils.confirm('delete all subscribers?', function(res){
              if(res){
                fetch('/post_rest', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'Sec-Fetch-Dest': 'object',
                    'Sec-Fetch-mode': 'same-origin',
                    'Sec-Fetch-Site': 'same-origin'
                  },
                  body: g.js({
                    dest: 'subscribed',
                    data: {
                      action: 'reset'
                    }
                  })
                }).then(function(res) {
                  if (res.status >= 200 && res.status < 300) {
                    return res.json();
                  } else {
                    return Promise.reject(new Error(res.statusText))
                  }
                }).then(function(data) {
                  g.cl(data)
                  if(data.success){
                    utils.toast('success', data.msg);
                    var sync_db = new Event('sync_db');
                    window.dispatchEvent(sync_db);
                  } else {
                    utils.mload.del(event.target, 'Reset');
                    utils.toast('danger', data.msg);
                  }
                })
              } else {
                return utils.mload.del(event.target, 'Reset');
              }
            })
          }
        }, 'Reset'),
        h('button.btn.btn-outline-danger.btn-sm.float-right.mr-2.mt-2',{
          type: 'button',
          title: 'backup database',
          onclick: function(event){
            utils.mload.add(event.target);
            ws.send({type: 'subscribers_backup', data: evt});
            setTimeout(function(){
              utils.mload.del(event.target, 'Backup');
            },3000)
          }
        }, 'Backup'),
        sync_btn
      ),
      h('div.col-12',
        h('hr')
      )
    )

    main_wrap.append(
      row_main,
      h('div#subscribers_view_main'),
    )

    window.addEventListener('sync_db', function(){
      sync_btn.click()
    }, false)

    if(evt.length > 0){
      ss.set('pagitems', pagitems)
      ss.set('pag-current', 1);
      ss.set('pag-max', max);

      if(max < 6){
        for (let i = 0; i < max; i++) {
          item.append(pagination.pageItem(max,g.js(i + 1)))
        }
      } else {
        item.append(
          pagination.prevlink(max),
          pagination.pag_back(max),
          pagination.pageItem(max,'2'),
          pagination.pageItem(max,'3'),
          pagination.pageItem(max,'4'),
          pagination.pag_forw(max),
          pagination.nextlink(max)
        )
      }

      main_wrap.append(
        h('div#pagination',
          item,
          h('div.pag-text','viewing page ', h('span#pagnum', '1'), ' of '+ max)
        )
      )

      main.append(main_wrap);

      pagination.page_select(pagitems[0]);

    } else {
      main.append(main_wrap);
    }

  });

  ws.send({type: 'subscribers_list'});
  window.removeEventListener('socket_ready', init,false)
}

window.addEventListener('socket_ready', init, false)
