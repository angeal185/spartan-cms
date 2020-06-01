import { global as g } from  "/modules/global.mjs";
import { h } from "/modules/h.mjs";
import { ws } from  "/modules/ws.mjs";
import { utils } from  "/modules/utils.mjs";
import { ss,ls } from  "/modules/storage.mjs";

const tpl = {
  pag_post: function(pagtype, evt){
    return h('div.col-3',
        h('button.btn.btn-sm.btn-outline-info.mr-2', {
          type: 'button',
          onclick: function(){
            ls.set(pagtype +'_edit', evt);
            let dest = '/posts/edit';
            if(pagtype === 'news'){
              dest = '/news/edit'
            }
            location.href = dest;
          }
        }, 'Edit'),
        h('button.btn.btn-sm.btn-outline-danger', {
          type: 'button',
          onclick: function(){
            return ws.send({type: pagtype +'_delete', data: {date:evt.date}})
          }
        }, 'Delete')
      )
  },
  pag_subscribers: function(pagtype, evt){
    return h('div.col-3',
        h('button.btn.btn-sm.btn-outline-danger.float-right', {
          type: 'button',
          onclick: function(event){
            utils.mload.add(event.target);
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
                  action: 'delete',
                  hash: evt.hash
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
                utils.toast('success', data.msg);
                var sync_db = new Event('sync_db');
                window.dispatchEvent(sync_db);
              } else {
                utils.mload.del(event.target, 'Delete');
                utils.toast('danger', data.msg);
              }
            })
          }
        }, 'Delete')
      )
  },
  pag_contact: function(pagtype, evt){
    return h('div.col-12',
        h('button.btn.btn-sm.btn-outline-danger.float-right', {
          type: 'button',
          onclick: function(event){
            utils.mload.add(event.target);
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
                  action: 'delete',
                  item: evt.hash
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
                utils.toast('success', data.msg);
                event.target.parentNode.parentNode.parentNode.remove()
              } else {
                utils.mload.del(event.target, 'Delete');
                return utils.toast('danger', data.msg);
              }
            })
          }
        }, 'Delete'),
        h('button.btn.btn-sm.btn-outline-secondary.float-right.mr-2', {
          type: 'button',
          onclick: function(event){
            utils.mload.add(event.target);
          }
        }, 'Reply')
      )
  }
}

export { tpl }
