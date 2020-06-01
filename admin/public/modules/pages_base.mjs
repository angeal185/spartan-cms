import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

import "/js/prism/prism.js"
import "/modules/beautify/beautify-html.js"

ss.set('base_mode','meta');

var init = function(){

  window.addEventListener('page_base', function (evt) {
    evt = evt.detail;
    let pcmain = h('div.row'),
    row_base = pcmain.cloneNode(true),
    row_main = pcmain.cloneNode(true);
    let obj = ls.get('base_page');

    for (let i in obj) {
      row_base.append(
        h('div.form-group.col-3',
          h('button.btn.btn-outline-secondary.form-control.base_btn', {
            type: 'text',
            onclick: function(){
              let event = new CustomEvent('page_mode_change', {
                detail: i
              });
              ss.set('base_mode', i);
              document.getElementById('base-mode').innerText = i.replace('_', ' ');
              window.dispatchEvent(event);
            }
          }, i.replace('_', ' '))
        )
      )
    }


    row_main.append(
      h('div.form-group.col-md-12',
        h('div#html_div',
          h('label#base-mode', ''),
          h('div#html_editor')
        )
      ),
      h('div.form-group.col-md-12',
        h('label', 'Page final'),
        h('pre', h('code#base-final.language-html')),
      ),
      h('div.form-group.col-md-12',
        h('div.float-right',
          h('button.btn.btn-outline-info.mr-2',{
            type:'button',
            onclick: function(){
              let obj = ls.get('base_page');
              obj.jsonld = g.js(appconf.jsonld.base);
              ws.send({type: 'page_base_update', data: obj})
            }
          }, 'Commit'),
          h('button.btn.btn-outline-info.mr-2',{
            type:'button',
            onclick: function(){
              ws.send({type: 'page_base_reset'})
            }
          }, 'Reset')
        )
      )
    )

    document.getElementById('main-content').append(row_base, row_main)

    edt.init({ele: 'html_editor', mode: 'html'}, function(err, Ace){
      if(err){throw err}

        Ace.getSession().on('change', utils.debounce(function() {
          let mode = ss.get('base_mode'),
          newval = ls.get('base_page');
          newval[mode] = Ace.getValue();
          ls.set('base_page', newval)
          utils.update_base_final(html_beautify(utils.build_base_html(newval)))
        }, 1000))

        window.addEventListener('page_mode_change', function (evt) {
          evt = evt.detail;
          Ace.setValue(ls.get('base_page')[evt])
        })

        document.getElementsByClassName('base_btn')[0].click();
        utils.update_base_final(html_beautify(utils.build_base_html(evt)))

    })
  }, false);

  ws.send({type: 'page_base'});
  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
