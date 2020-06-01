import { global as g } from  "/modules/global.mjs";
import { editor as edt } from '/modules/editor.mjs';
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

let filetype = location.pathname.split('/').pop();
if(filetype === 'mjs'){
  filetype = 'js';
}

ss.set('file_get', '');


let init = function(){

  let base_item = document.title.split(' ')[1],
  editor_mode = base_item,
  row_main = h('div.row',
    h('div.col-6.form-group',
      h('select#file-select.custom-select',{
        size: 10,
        onchange: function(evt) {
          let item = this.value,
          dest = document.getElementById('file_mode');
          if(item !== ''){
            let arr = item.split('/');
            ss.set('file_get', item);
            document.getElementById('file_mode').value = item;
            document.getElementById('file_dir').value = arr.slice(0,-1).join('/');
            document.getElementById('file_name').value = arr.slice(arr.length -1).join('/');
            return ws.send({type: 'file_get', data: item})
          }
        }
      })
    ),
    h('div.col-6',
      h('div.row',
        h('div.col-12.form-group',
          h('label', 'selected'),
          h('input#file_mode.form-control', {
            type: 'text',
            readOnly: true
          }),
        ),
        h('div.col-6.form-group',
          h('label', 'dir'),
          h('input#file_dir.form-control', {
            type: 'text',
            readOnly: true
          }),
        ),
        h('div.col-6.form-group',
          h('label', 'file'),
          h('input#file_name.form-control', {
            type: 'text',
            readOnly: true
          }),
        ),
        h('div.col-12.form-group',
          h('div.btn-group.w-100',
            h('button.btn.btn-outline-secondary', {
              type: 'text',
              onclick: function(){
                let event = new Event('file_update');
                window.dispatchEvent(event);
              }
            }, 'update'),
            h('button.btn.btn-outline-secondary', {
              type: 'text',
              onclick: function(){
                let event = new Event('file_backup');
                window.dispatchEvent(event);
              }
            }, 'backup'),
            h('button.btn.btn-outline-secondary', {
              type: 'text',
              onclick: function(){
                let event = new Event('file_create');
                window.dispatchEvent(event);
              }
            }, 'create'),
            h('button.btn.btn-outline-secondary', {
              type: 'text',
              onclick: function(){
                let event = new Event('file_delete');
                window.dispatchEvent(event);
              }
            }, 'delete')
          )
        )
      )
    ),
    h('div.col-12',
      h('span.float-right',
        h('span.cp', {
          onclick: function(){
            let event = new Event('file_min');
            window.dispatchEvent(event);
          }
        },'min'),
        ' / ',
        h('span.cp', {
          onclick: function(){
            let event = new Event('file_max');
            window.dispatchEvent(event);
          }
        },'max'),
      ),
      h('div#editor.w-100')
    )
  )

  document.getElementById('main-content').append(
    h('h3', 'Files'),
    row_main
  );

  if(base_item === 'js' || 'mjs'){
    editor_mode = 'javascript';
  }

  if(base_item === 'styl'){
    editor_mode = 'stylus';
  }

  edt.init({ele: 'editor', mode: editor_mode}, function(err, Ace){
    if(err){throw err}

    window.addEventListener("list_files", function(evt) {
      evt = evt.detail;
      let dest = document.getElementById('file-select');

      for (let i = 0; i < evt.length; i++) {
        dest.append(h('option', {
          value: evt[i]
        },evt[i]))
      }

    });

    window.addEventListener("file_get", function(evt) {
      evt = evt.detail;
      Ace.setValue(evt);
      return utils.toast('success', 'file load success');
    });

    window.addEventListener("file_max", function(evt) {
      let code = Ace.getValue();
      let res = utils.max[filetype](code);
      if(res !== null){
        Ace.setValue(res);
      }
    });

    window.addEventListener("min_"+ filetype, function(evt) {
      evt = evt.detail;
      if(evt !== null){
        return Ace.setValue(evt);
      }
      return utils.toast('danger', 'minify error, check your code');
    });

    window.addEventListener("file_min", function(evt) {
      let code = Ace.getValue();
      utils.min[filetype](code)
    });



    window.addEventListener("file_backup", function(evt) {
      evt = evt.detail;

      return utils.toast('success', 'file backup success');
    });

    window.addEventListener("file_delete", function(evt) {
      evt = evt.detail;

      return utils.toast('success', 'file delete success');
    });

    window.addEventListener("file_create", function(evt) {
      evt = evt.detail;

      return utils.toast('success', 'file create success');
    });

    window.addEventListener("file_update", function() {
      let data = Ace.getValue(),
      dest = ss.get('file_get');
      if(dest === ''){
        return utils.toast('danger', 'no file chosen');
      }

      ws.send({
        type: 'file_update', data: {
          dest: dest,
          data: data
        }
      })

    });

    console.log(['styl', 'sass', 'less'].indexOf(base_item))

    if(['styl', 'sass', 'less'].indexOf(base_item) !== -1){
      console.log(base_item)
      ws.send({type: 'list_files', data: './dev/**/**/*.'+ base_item})
    } else {
      ws.send({type: 'list_files', data: './blog/app/**/**/*.'+ base_item})
    }

  })


  window.removeEventListener('socket_ready', init, false);

}

window.addEventListener('socket_ready', init, false)
