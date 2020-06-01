import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

var init = function(){
  let row_main = h('div.row'),
  apisort = h('div#apisort.list-group.col');

  for (let i = 0; i < appconf.api.length; i++) {
    apisort.append(
      utils.return_api_item(appconf.api[i])
    )
  }

  document.getElementById('main-content').append(
    h('div.col-12',
      h('h3', 'API',
        h('button.btn.btn-outline-secondary.btn-sm.float-right', {
          onclick: function(){
            apisort.append(
              utils.return_api_item({url:'/new.json', example: '/new.json', description: 'add description'})
            )
            utils.update_api_data();
          }
        }, 'Add new item')
      )
    ),
    h('hr'),
    apisort
  );

  utils.api_sort(apisort);

  window.removeEventListener('socket_ready', init, false);
}



window.addEventListener('socket_ready', init, false)
