import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

import "/js/prism/prism.js"


void function(){
  let pcmain = h('div.row'),
  pholder, cval,
  row_base = pcmain.cloneNode(true),
  row_main = pcmain.cloneNode(true);

  ss.set('page_mode', 'html')
  ss.set('page_title', 'new_page_title')

  row_base.append(
    h('div.form-group.col-md-3',
      h('label', 'Title'),
      h('input#page_title.form-control', {
        type: 'text',
        value: 'new_page_title',
        onkeyup: function(evt) {
          this.value = this.value.replace(/ /g, '_')
          ss.set('page_title', this.value);

          let event = new Event('page_update_title');
          window.dispatchEvent(event);

        }
      })
    ),
    h('div.form-group.col-md-3',
      h('label', 'Mode'),
      h('input#page_mode.form-control', {
        type: 'text',
        value: 'html',
        readOnly: true
      })
    ),
    h('div.form-group.col-md-3',
      h('label', 'Active'),
      h('div.input-group',
        h('input#page_status.form-control', {
          type: 'text',
          value: 'true',
          readOnly: true
        }),
        h('div.input-group-append',
          h('button.btn.btn-outline-secondary', {
            type: 'button',
            onclick: function(){
              let i = document.getElementById('page_status');
              if(i.value === 'true'){
                i.value = 'false';
              } else {
                i.value = 'true';
              }
            }
          }, 'toggle')
        )
      )
    ),
    h('div.form-group.col-md-3',
      h('label', 'sidebar'),
      h('div.input-group',
        h('input#page_sidebar.form-control', {
          type: 'text',
          value: 'true',
          readOnly: true
        }),
        h('div.input-group-append',
          h('button.btn.btn-outline-secondary', {
            type: 'button',
            onclick: function(){
              let i = document.getElementById('page_sidebar');
              if(i.value === 'true'){
                i.value = 'false';
              } else {
                i.value = 'true';
              }

              let event = new Event('page_update_title');
              return window.dispatchEvent(event);
            }
          }, 'toggle')
        )
      )
    )
  )

  row_main.append(
    h('div.form-group.col-md-12',
      h('label.w-100', 'Page data',
        h('span.float-right',
          h('span#html-toggle', {
            onclick: function(){
              utils.page_mode('html')
            }
          }, 'html'),
          ' / ',
          h('span#javascript-toggle', {
            onclick: function(){
              utils.page_mode('javascript')
            }
          }, 'javascript')
        )
      ),
      h('div#javascript_div.hidden',
        h('label', 'Javascript'),
        h('div#javascript_editor')
      ),
      h('div#html_div',
        h('label', 'HTML'),
        h('div#html_editor')
      )
    ),
    h('div.form-group.col-md-12',
      h('label', 'Page final'),
      h('pre', h('code#page_final.language-js')),
    ),
    h('div.form-group.col-md-12',
      h('div.float-right',
        h('button.btn.btn-outline-info.mr-2',{
          type:'button',
          onclick: function(){
            if(ss.get('page_title') === 'new_page_title' || ss.get('page_title') === ''){
              return utils.toast('info', 'page title error')
            }

            if(ss.get('page_data') === ''){
              return utils.toast('info', 'page data error')
            }

            let obj = {
              mode: ss.get('page_mode'),
              title: ss.get('page_title'),
              data: ss.get('page_data'),
              status: JSON.parse(document.getElementById('page_status').value)
            }
            ws.send({type: 'page_create', data: obj})
          }
        }, 'Commit')
      )
    ),
    h('hr.col-12')
  )


  document.getElementById('main-content').append(row_base, row_main)

  edt.init({ele: 'html_editor', mode: 'html'}, function(err, Ace){
    if(err){throw err}
    edt.init({ele: 'javascript_editor', mode: 'javascript'}, function(err, jvs){
      if(err){throw err}

      Ace.setValue("<p>page working</p>");
      jvs.setValue("main.append(h('p', 'page home working'));");

      jvs.getSession().on('change', utils.debounce(function() {
        if(ss.get('page_mode') !== 'html'){
          let has_sb = g.jp(document.getElementById('page_sidebar').value);
          ss.set('page_data', [has_sb, jvs.getValue()])
          ss.set('page_final', utils.return_page_js('cnf({sidebar: '+ has_sb +'});' + jvs.getValue()));
          utils.update_page_final()
        }
        return;
      }, 1000))

      Ace.getSession().on('change', utils.debounce(function() {
        if(ss.get('page_mode') !== 'javascript'){
          let has_sb = g.jp(document.getElementById('page_sidebar').value);
          ss.set('page_data', [has_sb, Ace.getValue()])
          ss.set('page_final', utils.return_page_js(['cnf({sidebar: '+ has_sb +'});', Ace.getValue()]));
          utils.update_page_final()
        }
        return;
      }, 1000))

      let has_sb = g.jp(document.getElementById('page_sidebar').value);
      ss.set('page_data', [has_sb, Ace.getValue()])
      ss.set('page_final', utils.return_page_js(['cnf({sidebar: '+ has_sb +'});', Ace.getValue()]));
      utils.update_page_final()

      window.addEventListener('page_update_title', function (e) {
        if(ss.get('page_mode') === 'html'){
          let has_sb = g.jp(document.getElementById('page_sidebar').value);
          ss.set('page_data', [has_sb, Ace.getValue()])
          ss.set('page_final', utils.return_page_js(['cnf({sidebar: '+ has_sb +'});', Ace.getValue()]));
          utils.update_page_final()
        } else {
          let has_sb = g.jp(document.getElementById('page_sidebar').value);
          ss.set('page_data', [has_sb, jvs.getValue()])
          ss.set('page_final', utils.return_page_js('cnf({sidebar: '+ has_sb +'});' + jvs.getValue()));
          utils.update_page_final()
        }
        utils.update_page_final()
      }, false);

    })
  })

}();
