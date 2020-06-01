import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";

var init = function(){

    let pcmain = h('div.row'),
    row_base = pcmain.cloneNode(),
    row_main = pcmain.cloneNode(),
    s_items = appconf.shortcut;

    row_base.append(
      h('div.col-6',
        h('h3', 'Shortcut')
      ),
      h('div.col-6',
        function(){
          let is_enabled = s_items.enabled,
          txt = 'enabled';

          if(!is_enabled){
            txt = 'disabled';
          }

          return h('button.btn.btn-outline-success.btn-sm.sh-95.float-right',{
            onclick: function(evt){
              utils.mload.add(evt.target);
              if(!is_enabled){
                s_items.enabled = true;
              } else {
                s_items.enabled = false;
              }
              return ws.send({type: 'update_shortcuts', data: s_items});
            }
          },txt)


        }
      ),
      h('hr.col-12')
    )

    for (let i = 0; i < s_items.items.length; i++) {
      row_main.append(
        h('div.col-lg-4',
          h('div.card.mb-4.sh-95',
            h('div.card-body',
              h('div.form-group',
                h('label', 'Shortcut '+ i),
                h('input.form-control.mb-2', {
                  value: s_items.items[i].title,
                  placeholder: 'title',
                  onkeyup: utils.debounce(function(evt){
                    s_items.items[i].title = this.value;
                    return ws.send({type: 'update_shortcuts', data: s_items});
                  },3000)
                }),
                h('input.form-control', {
                  value: s_items.items[i].dest,
                  placeholder: 'destination',
                  onkeyup: utils.debounce(function(evt){
                    s_items.items[i].dest = this.value;
                    return ws.send({type: 'update_shortcuts', data: s_items});
                  },3000)
                })
              )
            )
          )
        )
      )
    }

    document.getElementById('main-content').append(row_base, row_main)


  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
