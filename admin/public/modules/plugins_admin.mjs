import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

var init = function(){

  let plug_inst_div = h('div.row'),
  plug_avail_div = plug_inst_div.cloneNode(true),
  plug_avail = appconf.plugin_data.available;

  function return_plug_card(obj, installed){

    return h('div.col-md-6',
      h('div.card',
        h('div.card-header',
          h('h4.card-title',
            h('img.mr-2', {
              src: obj.ico_url
            }),
            obj.name.replace(/_/g, ' ')
          )
        ),
        h('div.card-body',
          h('p.font-weight-bold', 'Description: ',
            h('span.font-weight-light', obj.description)
          ),
          h('p.font-weight-bold', 'Author: ',
            h('span.font-weight-light', obj.author)
          ),
          h('p.font-weight-bold', 'version: ',
            h('span.font-weight-light', obj.version)
          ),
          h('p.font-weight-bold', 'Homepage: ',
            h('a.font-weight-light', {
              href: obj.homepage
            }, obj.homepage)
          ),
          h('button.btn.btn-sm.btn-outline-secondary.mt-4.float-right',{
            onclick: function(){
              location.href = [location.href, obj.name].join('/')
            }
          }, 'view')
        )
      )
    )
  }


  for (let i = 0; i < plug_avail.length; i++) {
    plug_avail_div.append(
      return_plug_card(plug_avail[i], false)
    )
  }

  document.getElementById('main-content').append(
    h('h3','Available plugins',
      h('span.float-right', 'Total: '+ plug_avail.length)
    ),
    plug_avail_div,
    h('hr')
  )

  console.log(appconf.plugin_data)
  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
