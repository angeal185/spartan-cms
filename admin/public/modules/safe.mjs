import { global as g } from  "/modules/global.mjs";
import { editor as edt } from '/modules/editor.mjs';
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

import  "/js/jsoneditor.js";

utils.addCSS('jsoneditor');
ss.set('safe_type', '')
var init = function(){

  let sel = h('select.custom-select',{
    size: 5,
    onchange:function(){
      ss.set('safe_type', this.value)
    }
  }),
  opt = h('option'),
  newopt;

  for (let i = 0; i < appconf.settings.items.length; i++) {
    newopt = opt.cloneNode(true);
    newopt.innerText = appconf.settings.items[i];
    newopt.value = appconf.settings.items[i];
    sel.append(newopt);
  }

  let safe_pass = h('input.form-control', {
    type: 'password'
  }),
  row_main = h('div.row',
    h('div.col-6',
      sel
    ),
    h('div.col-6.form-group',
      h('div.input-group.mb-2',
        h('div.input-group-prepend',
          h('div.input-group-text', 'password')
        ),
        safe_pass,
        h('div.input-group-append',
          h('div.input-group-text.far.fa-eye',{
            onclick: function(){
              if(safe_pass.type === 'text'){
                return safe_pass.type = 'password';
              }
              safe_pass.type = 'text';
            }
          })
        )
      ),
      h('div.input-group',
        h('div.input-group-prepend',
          h('div.input-group-text', 'keyfile path')
        ),
        h('input.form-control', {
          type: 'password',
          value: appconf.keyfile,
          readOnly: true
        }),
        h('div.input-group-append',
        h('div.input-group-text.far.fa-eye',{
          onclick: function(){
            let dest = this.parentNode.previousSibling;
            if(dest.type === 'text'){
              return dest.type = 'password';
            }
            dest.type = 'text';
            console.log(dest.type)
          }
        })
        )
      ),
      h('div.btn-group.mt-2.w-100',
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            let password = safe_pass.value,
            stype = ss.get('safe_type');
            if(password === ''){
              return utils.toast('danger', 'password cannot be empty');
            }
            if(stype === ''){
              return utils.toast('danger', 'no safe chosen');
            }
            return ws.send({
              type: 'safe_unlock',
              data: {
                password:password,
                type: type
              }
            })
          }
        }, 'unlock'),
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            let event = new Event('safe_update');
            window.dispatchEvent(event);
          }
        }, 'update'),
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            let password = safe_pass.value,
            items = appconf.settings.items;

            if(password === ''){
              return utils.toast('danger', 'password cannot be empty');
            }

            utils.prompt('enter new safe title', function(res){
              if(res){
                res = 'safe_'+ utils.snake_case(res);
                if(items.indexOf(res) !== -1){
                  return utils.toast('danger', 'safe title exists');
                }

                return ws.send({
                  type: 'safe_add',
                  data: {
                    type: res,
                    password: password
                  }
                })
              }
            })
          }
        }, 'new'),
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            let type = ss.get('safe_type'),
            items = appconf.settings.admin;

            if(type === ''){
              return utils.toast('danger', 'no safe chosen');
            }

            if(items.indexOf(type) !== -1){
              return utils.toast('danger', 'cannot delete this safe');
            }

            utils.confirm('delete safe '+ type +'?', function(res){
              if(res){
                return ws.send({
                  type: 'safe_delete',
                  data: type
                })
              }
            })
          }
        }, 'delete'),
      )
    ),
    h('div#jsneditor.col-12')
  )

  document.getElementById('main-content').append(
    h('h3', 'Safe'),
    row_main
  );

  let safe_edit = new JSONEditor(document.getElementById("jsneditor"), {
    modes: ['text', 'tree', 'form'],
    mode: 'tree',
    onChangeText: function(i){
      utils.valid_json(i);
    }
  });

  window.addEventListener('safe_unlock', function(evt) {
    evt = evt.detail;
    safe_edit.set(evt.data);
    ss.set('safe_type', evt.type);
  })

  window.addEventListener('safe_edit', function(evt) {
    evt = evt.detail;
    if(evt.type === 'delete'){
      let dest = sel.children;
      for (let i = 0; i < dest.length; i++) {
        if(dest[i].value === evt.title){
          dest[i].remove()
        }
        ss.set('safe_type', '')
      }
    }
    if(evt.type === 'add'){
      newopt = opt.cloneNode(true);
      newopt.innerText = evt.title;
      newopt.value = evt.title;
      sel.append(newopt)
    }
  })

  window.addEventListener('safe_update', function() {
    let data = safe_edit.get(),
    password = safe_pass.value,
    type = ss.get('safe_type');

    if(type === ''){
      return utils.toast('danger', 'no safe chosen');
    }
    if(password === ''){
      return utils.toast('danger', 'password cannot be empty');
    }
    try {
      data = g.js(g.jp(g.js(data)));
    } catch (err) {
      if(err){return utils.toast('danger', 'error in data');}
    }

    utils.confirm('update selected safe?', function(res){
      if(res){
        return ws.send({
          type: 'safe_update',
          data: {
            data: data,
            password: password,
            type: type
          }
        })
      }
    })

  })

  window.removeEventListener('socket_ready', init, false);
}



window.addEventListener('socket_ready', init, false)
