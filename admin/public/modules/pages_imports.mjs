import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";



ss.set('import_new', {name: '', url: ''});
ss.set('import_final', []);
var init = function(){
  let row_main = h('div#import-group.list-group.mb-4')

  document.getElementById('main-content').append(
    h('h3', 'Imports'),
    row_main,
    h('h3', 'Add import'),
    h('div.row',
      h('div.form-group.col-5',
        h('label', 'import'),
        h('input.form-control.input-sm', {
          type: 'text',
          placeholder: 'enter import name',
          onkeyup: function(){
            utils.update_new_import('name', this.value)
          }
        }),
      ),
      h('div.form-group.col-5',
        h('label', 'url'),
        h('input.form-control.input-sm', {
          type: 'text',
          placeholder: 'enter import url',
          onkeyup: function(){
            utils.update_new_import('url', this.value)
          }
        })
      ),
      h('div.form-group.col-2',
        h('label', 'confirm'),
        h('button.btn.btn-outline-success.btn-sm.form-control',{
          type: 'button',
          onclick: function(){
            let obj = ss.get('import_new'),
            final = ss.get('import_final')

            for (let i in obj) {
              if(obj[i] === ''){
                return utils.toast('danger', 'import '+ i +' cannot be empty!')
              }
            }
            final.push(obj);
            ss.set('import_final', final);

            document.getElementById('import-group').append(
              utils.import_item({name: obj.name, url: obj.url})
            )

            ws.send({type: 'update_import_order', data: final})

            utils.update_import_final()
          }
        }, 'Add new')
      )
    ),
    h('h3', 'Preview'),
    h('pre', h('code#import-final.language-js', ''))
  );



  window.removeEventListener('socket_ready', init, false);
    utils.update_import_final()

    ws.send({type: 'import_list'})

}

window.addEventListener("import_list", function(evt) {
  evt = evt.detail;

  let final = ss.get('import_final'),
  dest = document.getElementById('import-group');
  for (let i = 0; i < evt.length; i++) {
    final.push(evt[i]);
    dest.append(
      utils.import_item({name: evt[i].name, url: evt[i].url})
    )
  }
  ss.set('import_final', final);
  utils.update_import_final()

  utils.import_sort(dest)

});


window.addEventListener('socket_ready', init, false)
