import { global as g } from  "/modules/global.mjs";
import { editor as edt } from '/modules/editor.mjs';
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

import  "/js/jsoneditor.js";

utils.addCSS('jsoneditor');
ss.set('settings_mode', null);

var init = function(){

  let db_select = h('select.custom-select',{
    size: 6,
    onchange: function(evt) {
      let item = this.value;
      if(item !== ''){
        return ws.send({type: 'settings_get', mode: item})
      }
    }
  }),
  settings_items = appconf.settings;

  for (let i = 0; i < settings_items.length; i++) {
    db_select.append(
      h('option', {
        value: settings_items[i]
      }, settings_items[i])
    )
  }


  let row_main = h('div.row',
    h('div.col-6.form-group', db_select),
    h('div.col-6.form-group',
      h('label', 'selected'),
      h('input#settings_mode.form-control', {
        type: 'text',
        readOnly: true
      }),
      h('div.btn-group.mt-2.w-100',
        h('button.btn.btn-outline-secondary', {
          type: 'button',
          onclick: function(){
            let event = new Event('settings_update');
            window.dispatchEvent(event);
          }
        }, 'update')
      )
    ),
    h('div#jsneditor.col-12')
  )

  document.getElementById('main-content').append(
    h('h3', 'Settings'),
    row_main
  );

  let settings_edit = new JSONEditor(document.getElementById("jsneditor"), {
    modes: ['text', 'tree', 'form'],
    mode: 'form',
    onChangeText: function(i){
      utils.valid_json(i);
    }
  });

  window.addEventListener('settings_get', function (evt) {
    evt = evt.detail;
    settings_edit.set(evt);
  })

  window.addEventListener('settings_update', function () {
    let data = settings_edit.get(),
    mode = ss.get('settings_mode');

    if(mode === null){
      return utils.toast('info', 'mode not selected');
    }
    try {
      data = g.jp(g.js(data));
    } catch (err) {
      if(err){return utils.toast('danger', 'error in data');}
    }
    utils.confirm('update selected settings?', function(res){
      if(res){
        return ws.send({type: 'settings_update', data: settings_edit.get(), mode: ss.get('settings_mode')})
      }
    })

  })

  window.removeEventListener('socket_ready', init, false);


}



window.addEventListener('socket_ready', init, false)
