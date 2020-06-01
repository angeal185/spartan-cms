import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

import "/js/tinymce/tinymce.js"
import "/js/prism/prism.js"

function save_post_tpl(i){
  let tpldata = ls.get('post_create_'+ i),
  tpltitle = document.getElementById('tpl_'+ i +'_title').value;

  if(tpldata === '' || tpltitle === ''){
    return g.cl('incomplete template data');
  }

  ws.send({
    type: 'post_tpl_save',
    for: i,
    data: {
      title: tpltitle,
      data: tpldata
    }
  })
}

function delete_post_tpl(i){
  let tplsel = ss.get(i+ '_tpl_sel')

  if(tplsel === ''){
    return g.cl('no template chosen');
  }

  ws.send({
    type: 'post_tpl_delete',
    for: i,
    data: tplsel
  })
}

function template_sel(i){

  return h('div.col-sm-6',
    h('div.card',
      h('div.card-body',

        h('label', utils.capitalize(i) + ' templates'),
        h('select#'+ i +'_select.custom-select', {
          size: '3'
        }),
        h('div.row',
          h('div.col-6',
            h('div.input-group.input-group-sm.mt-2',
              h('input#tpl_'+ i +'_title.form-control', {
                placeholder: 'new template name',
                onkeyup: function(){
                  let val = this.value.replace(/ /g, '_')
                  this.value = val;
                }
              }),
              h('div.input-group-append',
                h('button#tpl_'+ i +'_save.btn.btn-outline-secondary', {
                  type: 'button',
                  onclick: function(){
                    save_post_tpl(i)
                  }
                }, 'Save')
              )
            )
          ),
          h('div.col-6',
            h('div.btn-group.mt-2.float-right',
              h('button.btn.btn-outline-secondary.btn-sm', {
                type: 'button',
                title: 'delete selected template',
                onclick: function(){
                  delete_post_tpl(i)
                }
              }, 'Delete')
            )
          )
        )
      )
    )
  )

}


var init = function(){
  let arr = ['title', 'subtitle', 'category', 'tags', 'author', 'image']

  let pcmain = h('div.row'),
  item, pholder, cval,
  row_base = pcmain.cloneNode(true),
  row_main = pcmain.cloneNode(true);

  if(!ls.get('current_post') || ls.get('current_post') === ''){
    ls.set('current_post', {
      title: '',
      subtitle: '',
      category: '',
      tags: [],
      author: '',
      image: '',
      preview: '',
      body: ''
    })
  }

  let cpostdata = ls.get('current_post');

  for (let i = 0; i < arr.length; i++) {
    cval = cpostdata[arr[i]]
    if(arr[i] === 'tags'){
      pholder = 'Enter tags seperated by comma',
      cval = cval.join(',')
    } else if (arr[i] === 'image'){
      pholder = 'Enter header image url'
    } else {
      pholder = 'Enter '+ arr[i]
    }

    item = h('div.form-group.col-md-6',
      h('label', utils.capitalize(arr[i])),
      h('input#post_'+ arr[i] +'.form-control', {
        type: 'text',
        placeholder: pholder,
        value: cval,
        onkeyup: function(evt) {
          let val = this.value;
          if(arr[i] === 'tags'){
            val = val.split(',')
          }
          utils.update_post('current_post', arr[i], val)
          utils.update_final('current_post');

        }
      })
    )
    row_base.append(item)
  }


  row_main.append(
    h('div.form-group.col-md-12',
      h('label', 'Blog preview'),
      h('textarea#post_preview.form-control',{
        value: cpostdata.preview,
        onkeyup: function(evt) {
          let val = this.value;
          this.nextSibling.innerText = val.length;
          utils.update_post('current_post', 'preview', val)
          utils.update_final('current_post');
        }
      }),
      h('small')
    ),

    h('div.form-group.col-md-12',
      h('label.w-100', 'Blog Post',
        h('span.float-right',
          h('span#richtext-toggle', 'Richtext'),
          ' / ',
          h('span#markdown-toggle', 'Markdown')
        )
      ),
      h('div#richtext-div',
        h('textarea#rich-editor')
      ),
      h('div#markdown-div.hidden',
        h('textarea#md_editor')
      ),
      h('div#post_editor')
    ),

    h('div.form-group.col-md-12',
      h('label', 'Blog final'),
      h('pre', h('code#post_final.language-json')),
    ),
    h('div.form-group.col-md-12',
      h('div.float-right',
        h('button.btn.btn-outline-info.mr-2',{
          type:'button',
          onclick: function(){
            let obj = ls.get('current_post');

            for (let key in obj) {
              if(obj[key].length < 1 || obj[key][0] === ''){
                return utils.toast('danger', key + ' error')
              }
            }

            obj.date = Date.now();

            ws.send({type: 'post_create', data: obj})
          }
        }, 'Commit'),
        h('button.btn.btn-outline-danger',{
          type:'button',
          onclick: function(){

          }
        }, 'Reset')
      )
    ),
    h('hr.col-12'),
    template_sel('HTML'),
    template_sel('markdown')
  )


  document.getElementById('main-content').append(row_base, row_main)
  utils.update_final('current_post');


  edt.init({ele: 'post_editor', mode: 'html'}, function(err, Ace){
    if(err){throw err}
    Ace.setValue(cpostdata.body)
    edt.init({ele: 'md_editor', mode: 'markdown'}, function(err, md){
      if(err){throw err}

      utils.toggle_editor(['richtext', 'markdown']);
      utils.toggle_editor(['markdown', 'richtext']);

      md.getSession().on('change', utils.debounce(function() {
        let data = md.getValue();
        ls.set('post_create_markdown', data)
        ws.send({type: 'markdown', data: data})
      }, 3000))

      window.addEventListener('markdown_parse', function (e) {
        Ace.setValue(ls.get('post_create_HTML'))
      }, false);

      window.addEventListener('markdown_tpl_load', function (e) {
        md.setValue(ss.get('markdown_tpl_load'))
      }, false);

      window.addEventListener('HTML_tpl_load', function (e) {
        Ace.setValue(ss.get('HTML_tpl_load'))
      }, false);

      Ace.getSession().on('change', function(){
        utils.update_post('current_post', 'body', Ace.getValue());
        ls.set('post_create_HTML', tinymce.activeEditor.getContent())
        utils.update_final('current_post');
      });

      tinymce.init(appconf.tinymce);

      tinymce.activeEditor.on('keyup', function(){
        Ace.setValue(tinymce.activeEditor.getContent())
      })

      let tplarr = ['HTML', 'markdown'];

      for (let i = 0; i < tplarr.length; i++) {
        utils.getJson('data/tpl/'+tplarr[i]+'_post', function(err, res){
          if(err){return g.ce(err)}
          let sel = document.getElementById(tplarr[i] +'_select')
          for (let x = 0; x < res.length; x++) {
            sel.append(h('option', {
              value: res[x].title,
              onclick: function(){
                ss.set(tplarr[i]+'_tpl_sel', this.value)
                if(tplarr[i] === 'markdown'){
                  md.setValue(res[x].data)
                } else {
                  Ace.setValue(res[x].data)
                }
              }
            }, res[x].title))
          }
          ss.set(tplarr[i]+'_tpl_sel', '')
        })
      }


    })
  })
  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
