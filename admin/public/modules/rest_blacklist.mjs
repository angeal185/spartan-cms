import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { enc } from  "/modules/enc.mjs";
import { ss } from  "/modules/storage.mjs";


var init = function(){

  window.addEventListener("restblacklist_list", function(evt) {
    evt = evt.detail;

    let main = document.getElementById('main-content'),
    main_wrap = h('div.container-fluid'),
    row_main = h('div.row'),
    items = h('div.list-group'),
    sync_btn = h('button.btn.btn-outline-info.btn-sm.mr-2.float-right.mt-2',{
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
            dest: 'blacklist'
          })
        }).then(function(res) {
          if (res.status >= 200 && res.status < 300) {
            return res.json();
          } else {
            return Promise.reject(new Error(res.statusText))
          }
        }).then(function(data) {
          if(data.error){
            utils.mload.del(event.target, 'Sync');
            return utils.toast('danger', data.msg);
          }
          return ws.send({type: 'restblacklist_update', data: data});
        }).catch(function(err) {
          g.cl('Request failed', err);
          utils.mload.del(event.target, 'Sync');
          return utils.toast('danger', 'unable to fetch blacklist data');
        });

      }
    }, 'Sync');

    row_main.append(
      h('div.col-md-6',
        h('h3', 'Spartan rest Blacklist')
      ),
      h('div.col-md-6',
        h('button.btn.btn-outline-danger.btn-sm.float-right.mt-2',{
          type: 'button',
          title: 'reset database',
          onclick: function(event){
            utils.mload.add(event.target);
            utils.confirm('reset rest blacklist?', function(res){
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
                    dest: 'blacklist',
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
                    sync_btn.click();
                    return utils.toast('success', data.msg);
                  } else {
                    utils.mload.del(event.target, 'Reset');
                    return utils.toast('danger', data.msg);
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
            ws.send({type: 'restblacklist_backup', data: evt});
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
      row_main
    )

    if(evt.length > 0){

      for (let i = 0; i < evt.length; i++) {
        items.append(
          h('div.list-group-item',
            h('div.row',
              h('div.col-6', h('span.far.fa-eye.mr-2.cp',{
                title: 'toggle display',
                onclick: function(){
                  this.parentNode.parentNode.lastChild.classList.toggle('hidden')
                }
              }),evt[i]),
              h('div.col-6',
                h('button.btn.btn-outline-danger.btn-sm.float-right',{
                  type: 'button',
                  onclick: function(event){
                    utils.mload.add(event.target);
                    utils.confirm('delete ip '+ evt[i] +' from blacklist?', function(res){
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
                            dest: 'blacklist',
                            data: {
                              action: 'delete',
                              item: evt[i]
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
                            sync_btn.click();
                            return utils.toast('success', data.msg);
                          } else {
                            utils.mload.del(event.target, 'Delete');
                            return utils.toast('danger', data.msg);
                          }
                        })
                      } else {
                        return utils.mload.del(event.target, 'Delete');
                      }
                    })
                  }
                }, 'Delete'),
                h('button.btn.btn-outline-danger.btn-sm.float-right.mr-2',{
                  type: 'button',
                  onclick: function(event){
                    utils.mload.add(event.target);
                    fetch(appconf.trace_url + evt[i], {
                      method: 'GET',
                      headers: {
                      //  'Content-Type': 'application/json',
                        'Accept-Encoding': 'gzip',
                        'Sec-Fetch-Dest': 'object',
                        'Sec-Fetch-mode': 'cors',
                        'Sec-Fetch-Site': 'cross-site'
                      }
                    }).then(function(res) {
                      if (res.status >= 200 && res.status < 300) {
                        return res.json();
                      } else {
                        return Promise.reject(new Error(res.statusText))
                      }
                    }).then(function(data) {
                      let i_dest = event.target.parentNode.parentNode.lastChild;
                      for (let i in data) {
                        if(data[i] !== ''){
                          i_dest.append(
                            h('div.col-6',
                              h('div.form-group',
                                h('label', i),
                                h('input.form-control', {
                                  value: data[i]
                                })
                              )
                            )
                          )
                        }
                      }
                      i_dest.append(h('div.col-12',
                        h('div.form-group',
                          h('label.w-100', 'json',
                            h('span.float-right.sh-95.cp', {
                              onclick: function(event){
                                utils.mload.add(event.target);
                                ws.send({type: 'restblacklist_save', data: data});
                                setTimeout(function(){
                                  utils.mload.del(event.target, 'Save');
                                },3000)
                              }
                            },'Save')
                          ),
                          h('textarea.form-control', {
                            rows: 6,
                            value: g.js(data,0,2)
                          })
                        )
                      ))
                      utils.mload.del(event.target, 'Trace');
                      return utils.toast('success', 'ip trace success');
                    }).catch(function(err) {
                      utils.mload.del(event.target, 'Trace');
                      return utils.toast('success', 'ip trace failed');
                    });

                  }
                }, 'Trace')
              ),
              h('div.col-12.row')
            )
          )
        )
      }
      main_wrap.append(
        items
      )
    }

    main.append(main_wrap);
  });

  ws.send({type: 'restblacklist_list'});
  window.removeEventListener('socket_ready', init,false)
}

window.addEventListener('socket_ready', init, false)
