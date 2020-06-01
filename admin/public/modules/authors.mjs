import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

import "/js/prism/prism.js"

var init = function(){
  let arr = ['author', 'image', 'status', 'location', 'contact', 'post_count', 'last_post', 'first_post'],
  authors = [];

  let pcmain = h('div.row'),
  op = h('option'),
  item, cval, readonly,
  row_base = pcmain.cloneNode(true),
  row_main = pcmain.cloneNode(true);

  ls.set('current_author', appconf.authors[0])

  let authdata = ls.get('current_author');

  let sel = h('select.custom-select.mb-4', {
    size: 3,
    onchange: function(){

      for (let i = 0; i < appconf.authors.length; i++) {
        if(appconf.authors[i].author === this.value){
          for (let val in appconf.authors[i]) {
            document.getElementById('post_'+ val).value = appconf.authors[i][val]
          }
        }
      }
    }
  })

  for (let i = 0; i < appconf.authors.length; i++) {
    authors.push(appconf.authors[i].author)
    item = op.cloneNode(true);
    item.value = appconf.authors[i].author;
    item.innerText = appconf.authors[i].author;
    sel.append(item)
  }

  row_base.append(h('div.col-12',
    h('div.row',
      h('div.col-6',
        sel
      )
    )
  ))
  for (let i = 0; i < arr.length; i++) {
    cval = authdata[arr[i]];

    if(['last_post', 'first_post', 'post_count'].indexOf(arr[i]) !== -1){
      readonly = true;
    } else {
      readonly = false;
    }

    item = h('div.form-group.col-md-6',
      h('label', utils.capitalize(arr[i]).replace(/_/g, ' ')),
      h('input#post_'+ arr[i] +'.form-control', {
        type: 'text',
        value: cval,
        readOnly: readonly,
        onkeyup: function(evt) {
          let val = this.value;
          utils.update_post('current_author', arr[i], val)
          utils.update_final('current_author');

        }
      })
    )
    row_base.append(item)
  }


  row_main.append(
    h('div.form-group.col-md-12',
      h('label', 'Author info'),
      h('textarea#post_details.form-control',{
        value: authdata.details,
        onkeyup: function(evt) {
          let val = this.value;
          this.nextSibling.innerText = val.length;
          utils.update_post('current_author', 'details', val)
          utils.update_final('current_author');
        }
      }),
      h('small')
    ),


    h('div.form-group.col-md-12',
      h('label', 'Author final'),
      h('pre', h('code#post_final.language-json')),
    ),
    h('div.form-group.col-md-12',
      h('div.float-right',
        h('button.btn.btn-outline-danger.mr-2',{
          type:'button',
          onclick: function(){
            let auth_del = ls.get('current_author').author,
            auth_data = []

            if(authors.indexOf(auth_del) === -1){
              return utils.toast('danger', 'author does not yet exist')
            }

            if(auth_del === 'admin'){
              return utils.toast('danger', 'can not delete default author')
            }

            for (let i = 0; i < appconf.authors.length; i++) {
              if(appconf.authors[i].author !== auth_del){
                auth_data.push(appconf.authors[i])
              }
            }
            ws.send({type: 'author_update', data: auth_data})
          }
        }, 'Delete'),
        h('button.btn.btn-outline-info.mr-2',{
          type:'button',
          onclick: function(){
            let auth_new = ls.get('current_author'),
            auth_data = [];
            if(auth_new.author === ''){
              return utils.toast('danger', 'no author given')
            }

            for (let i = 0; i < appconf.authors.length; i++) {
              auth_data.push(appconf.authors[i]);
            }

            if(authors.indexOf(auth_new.author) === -1){
              auth_new.last_post = '';
              auth_new.first_post = '';
              auth_new.post_count = 0;
              auth_data.push(auth_new);
            } else {
              for (let i = 0; i < auth_data.length; i++) {
                if(auth_data[i].author === auth_new.author){
                  auth_data[i] = auth_new;
                }
              }
            }
            ws.send({type: 'author_update', data: auth_data})
          }
        }, 'Commit')
      )
    )
  )


  document.getElementById('main-content').append(row_base, row_main)
  utils.update_final('current_author');

  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
