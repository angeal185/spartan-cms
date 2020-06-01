import { global as g } from  "/modules/global.mjs";
import { editor as edt } from '/modules/editor.mjs';
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

import  "/js/jsoneditor.js";

utils.addCSS('jsoneditor');
ss.set('ld_mode', null);

var init = function(){

  let db_select = h('select.custom-select',{
    size: 6,
    onchange: function(evt) {
      let item = this.value;
      if(item !== ''){
        let event = new CustomEvent("ld_get", {
          detail: item
        });
        window.dispatchEvent(event);
        document.getElementById('ld_mode').value = item;
      }
    }
  }),
  db_items = ['base', 'post', 'entry'];

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
      h('input#ld_mode.form-control', {
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
            let event = new Event('ld_update');
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
          let event = new CustomEvent("ld_import", {
            detail: res
          });
          window.dispatchEvent(event);
        });
      }
    })
  )

  document.getElementById('main-content').append(
    h('h3', 'JSON-ld Schema'),
    row_main
  );

  let ld_edit = new JSONEditor(document.getElementById("jsneditor"), {
    modes: ['text', 'tree', 'form'],
    mode: 'tree',
    onChangeText: function(i){
      utils.valid_json(i);
    }
  });

  window.addEventListener('ld_get', function (evt) {
    evt = evt.detail;
    ss.set('ld_mode', evt);
    ld_edit.set(appconf.jsonld[evt]);
  })

  window.addEventListener('ld_update', function () {
    let data = ld_edit.get(),
    mode = ss.get('ld_mode');
    if(mode === null){
      return utils.toast('info', 'mode not selected');
    }
    try {
      data = g.jp(g.js(data));
    } catch (err) {
      if(err){return utils.toast('danger', 'error in data');}
    }
    utils.confirm('update selected shema?', function(res){
      if(res){
        let final = appconf.jsonld;
        final[ss.get('ld_mode')] = data;
        return ws.send({type: 'ld_update', data: final})
      }
    })

  })

  window.addEventListener('ld_import', function (evt) {
    evt = evt.detail;
    let mode = ss.get('ld_mode');
    if(mode === null){
      return utils.toast('info', 'mode not selected');
    } else if(typeof evt !== 'object'){
      return utils.toast('danger', 'error in data, cannot import.');
    } else {
      ld_edit.set(evt);
      return utils.toast('success', 'data import success');
    }
  })

  window.removeEventListener('socket_ready', init, false);

}



window.addEventListener('socket_ready', init, false)
