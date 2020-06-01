import { global as g } from  "/modules/global.mjs";
import { editor as edt } from '/modules/editor.mjs';
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

import  "/js/jsoneditor.js";

utils.addCSS('jsoneditor');
ss.set('database_mode', null);

var init = function(){

  let db_select = h('select.custom-select',{
    size: 6,
    onchange: function(evt) {
      let item = this.value;
      if(item !== ''){
        return ws.send({type: 'database_get', mode: item})
      }
    }
  }),
  db_items = ['posts', 'news', 'category_post','author_post', 'tags_post', 'category_news', 'pages', 'page_base', 'imports', 'user'];

  for (let i = 0; i < db_items.length; i++) {
    db_select.append(
      h('option', {
        value: db_items[i]
      }, db_items[i])
    )
  }


  let row_main = h('div.row',
    h('div.col-6.form-group', db_select),
    h('div.col-6.form-group',
      h('label', 'selected'),
      h('input#database_mode.form-control', {
        type: 'text',
        readOnly: true
      }),
      h('div.btn-group.mt-2.w-100',
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            document.getElementById('fileread').click();
          }
        }, 'import'),
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            let event = new Event('database_export');
            window.dispatchEvent(event);
          }
        }, 'export'),
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            let event = new Event('database_update');
            window.dispatchEvent(event);
          }
        }, 'update')
      )
    ),
    h('div#jsneditor.col-12'),
    h('input#fileread',{
      type: 'file',
      hidden: true,
      onchange: function(evt){
        utils.readFile(evt, function(err,res){
          if(err){return utils.toast('danger', 'error in import data');}
          let event = new CustomEvent("database_import", {
            detail: res
          });
          window.dispatchEvent(event);
        });
      }
    })
  )

  document.getElementById('main-content').append(
    h('h3', 'Database'),
    row_main
  );

  let db_edit = new JSONEditor(document.getElementById("jsneditor"), {
    modes: ['text', 'tree', 'form'],
    mode: 'form',
    onChangeText: function(i){
      utils.valid_json(i);
    }
  });

  window.addEventListener('database_get', function (evt) {
    evt = evt.detail;
    db_edit.set(evt);
  })

  window.addEventListener('database_update', function () {
    let data = db_edit.get(),
    mode = ss.get('database_mode');

    if(mode === null){
      return utils.toast('info', 'mode not selected');
    }
    try {
      data = g.jp(g.js(data));
    } catch (err) {
      if(err){return utils.toast('danger', 'error in data');}
    }
    utils.confirm('update selected database?', function(res){
      if(res){
        return ws.send({type: 'database_update', data: db_edit.get(), mode: ss.get('database_mode')})
      }
    })

  })

  window.addEventListener('database_export', function () {
    let data = db_edit.get(),
    mode = ss.get('database_mode');
    if(mode === null){
      return utils.toast('info', 'mode not selected');
    }
    if(mode === 'user'){
      return utils.toast('danger', 'bad idea');
    }
    try {
      ws.send({type: 'database_export', data: g.js(data), mode: mode})
    } catch (err) {
      if(err){return utils.toast('danger', 'error in data, cannot export.');}
    }
  })

  window.addEventListener('database_import', function (evt) {
    evt = evt.detail;
    let mode = ss.get('database_mode');
    if(mode === null){
      return utils.toast('info', 'mode not selected');
    } else if(mode === 'user'){
      return utils.toast('danger', 'bad idea');
    } else if(typeof evt !== 'object'){
      return utils.toast('danger', 'error in data, cannot import.');
    } else {
      db_edit.set(evt);
      return utils.toast('success', 'data import success');
    }
  })

  window.removeEventListener('socket_ready', init, false);


}



window.addEventListener('socket_ready', init, false)
