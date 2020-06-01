import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { enc } from  "/modules/enc.mjs";
import { ss } from  "/modules/storage.mjs";
import { pagination } from  "/modules/pagination.mjs";


var init = function(){

  ss.set('pagtype', 'contact')

  window.addEventListener("contact_list", function(evt) {
    evt = evt.detail;

    let main = document.getElementById('main-content'),
    main_wrap = h('div.container-fluid'),
    row_main = h('div.row'),
    item = h('ul.pagination'),
    pagitems = utils.chunk(evt, 20) || [],
    max = pagitems.length,
    sync_btn = h('button.btn.btn-outline-info.btn-sm.mr-2.mt-2.float-right',{
      type: 'button',
      title: 'sync',
      onclick: function(){
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
            dest: 'contact'
          })
        }).then(function(res) {
          if (res.status >= 200 && res.status < 300) {
            return res.json();
          } else {
            return Promise.reject(new Error(res.statusText))
          }
        }).then(function(data) {
          if(!data.error){
            let count = 0,
            hash_arr = [],
            new_arr = [];

            if(data.length < 1){
              g.cl('messages empty');
              return ws.send({type: 'contact_update', data: []});
            }

            for (let i = 0; i < evt.length; i++) {
              hash_arr.push(data[i].hash);
            }

            for (let i = 0; i < data.length; i++) {
              if(hash_arr.indexOf(data[i].hash) === -1){
                new_arr.push(data[i])
              }
            }


            for (let i = 0; i < new_arr.length; i++) {

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
                  dest: 'contact_item',
                  item: new_arr[i].title
                })
              }).then(function(res) {
                if (res.status >= 200 && res.status < 300) {
                  return res.json();
                } else {
                  return Promise.reject(new Error(res.statusText))
                }
              }).then(function(data) {
                let enc_data = data.data;
                enc.rsa_oaep_dec(appconf.privateKey, {data: enc.hex2u8(enc_data.ctext), sha: '512'}, function(err,ptext){
                  if(err){return utils.toast('danger', 'message '+ i +' rsa decrypt error');}
                  ptext = g.jp(ptext);
                  enc.aes_gcm_dec({key: ptext.key, iv: ptext.iv}, enc_data.data,function(err,res){
                    if(err){return utils.toast('danger', 'message '+ i +' aes decrypt error');}
                    res = g.jp(res);
                    data.name = res.name;
                    data.msg = res.msg;
                    data.email = res.email;
                    delete data.data;
                    evt.push(data);
                    count++;
                    if(count === (new_arr.length)){
                      utils.toast('success', 'messages up to date');
                      return ws.send({type: 'contact_update', data: evt});
                    }
                  })
                })
              }).catch(function(err) {
                g.ce(err);
                return utils.toast('danger', 'message ' + i + ' failed to fetch');
              });
            }
          } else {
            utils.mload.del(event.target, 'Sync');
            return utils.toast('danger', data.msg);
          }
        }).catch(function(err) {
          g.ce('Request failed', err);
          utils.mload.del(event.target, 'Sync');
          return utils.toast('danger', 'message list failed to fetch');
        });

      }
    }, 'Sync');

    row_main.append(
      h('div.col-6',
        h('h3', 'Messages')
      ),
      h('div.col-6',
        h('button.btn.btn-outline-danger.btn-sm.float-right.mt-2',{
          type: 'button',
          title: 'reset database',
          onclick: function(event){
            utils.mload.add(event.target);
            utils.confirm('delete all messages?', function(res){
              if(res){
                event.target.setAttribute('disabled', true)
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
                    dest: 'contact',
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
                  if(data.success){
                    g.cl(data)
                    utils.toast('success', data.msg);
                    setTimeout(function(){
                      location.reload();
                    },3000)
                  } else {
                    utils.mload.del(event.target, 'Reset');
                    return utils.toast('danger', data.msg);
                  }
                })


              } else {
                utils.mload.del(event.target, 'Reset');
              }
            })
          }
        }, 'Reset'),
        sync_btn
      ),
      h('div.col-12',
        h('hr')
      )
    )

    main_wrap.append(
      row_main,
      h('div#contact_view_main'),
    )

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

  ws.send({type: 'contact_list'});
  window.removeEventListener('socket_ready', init,false)
}

window.addEventListener('socket_ready', init, false)
