import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

import "/js/tinymce/tinymce.js"
import "/js/prism/prism.js"


var init = function(){
  let arr = ['title', 'subtitle', 'category', 'author']

  let pcmain = h('div.row'),
  item, pholder, cval,
  row_base = pcmain.cloneNode(true),
  row_main = pcmain.cloneNode(true);

  if(!ls.get('current_news') || ls.get('current_news') === ''){
    ls.set('current_news', {
      title: '',
      subtitle: '',
      category: '',
      author: '',
      preview: '',
      body: ''
    })
  }

  let cnewsdata = ls.get('current_news');

  for (let i = 0; i < arr.length; i++) {
    cval = cnewsdata[arr[i]]
    pholder = 'Enter '+ arr[i]

    item = h('div.form-group.col-md-6',
      h('label', utils.capitalize(arr[i])),
      h('input#news_'+ arr[i] +'.form-control', {
        type: 'text',
        placeholder: pholder,
        value: cval,
        onkeyup: function(evt) {
          let val = this.value;

          utils.update_post('current_news', arr[i], val)
          utils.update_final('current_news');

        }
      })
    )
    row_base.append(item)
  }


  row_main.append(
    h('div.form-group.col-md-12',
      h('label', 'News preview'),
      h('textarea#news_preview.form-control',{
        value: cnewsdata.preview,
        onkeyup: function(evt) {
          let val = this.value;
          this.nextSibling.innerText = val.length;
          utils.update_post('current_news', 'preview', val)
          utils.update_final('current_news');
        }
      }),
      h('small')
    ),

    h('div.form-group.col-md-12',
      h('label.w-100', 'News entry',
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
      h('div#news_editor')
    ),
    h('div.form-group.col-md-12',
      h('label', 'News entry final'),
      h('pre', h('code#post_final.language-json')),
    ),
    h('div.form-group.col-md-12',
      h('div.float-right',
        h('button.btn.btn-outline-info.mr-2',{
          type:'button',
          onclick: function(){
            let obj = ls.get('current_news');

            for (let key in obj) {
              if(obj[key].length < 1 || obj[key][0] === ''){
                return utils.toast('danger', key + ' error')
              }
            }

            obj.date = Date.now();

            ws.send({type: 'news_create', data: obj})
          }
        }, 'Commit')
      )
    )
  )


  document.getElementById('main-content').append(row_base, row_main)
  utils.update_final('current_news');


  edt.init({ele: 'news_editor', mode: 'html'}, function(err, Ace){
    if(err){throw err}
    Ace.setValue(cnewsdata.body)
    edt.init({ele: 'md_editor', mode: 'markdown'}, function(err, md){
      if(err){throw err}

      utils.toggle_editor(['richtext', 'markdown']);
      utils.toggle_editor(['markdown', 'richtext']);

      md.getSession().on('change', utils.debounce(function() {
        let data = md.getValue();
        ls.set('news_create_markdown', data)
        ws.send({type: 'markdown', data: data, dest: 'news'})
      }, 3000))

      window.addEventListener('markdown_parse', function (e) {
        Ace.setValue(ls.get('news_create_HTML'))
      }, false);

      Ace.getSession().on('change', function(){
        utils.update_post('current_news', 'body', Ace.getValue());
        ls.set('news_create_HTML', tinymce.activeEditor.getContent())
        utils.update_final('current_news');
      });

      tinymce.init(appconf.tinymce);

      tinymce.activeEditor.on('keyup', function(){
        Ace.setValue(tinymce.activeEditor.getContent())
      })

    })
  })
  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
