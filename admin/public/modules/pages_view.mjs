import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

var init = function(){
  let row_main = h('div.row'),
  navsort = h('div#navsort.list-group.col'),
  arr = ['title','active'];

  for (let i = 0; i < arr.length; i++) {
    row_main.append(h('div.col-4', arr[i]))
  }

  row_main.append(
    h('div.col-12',
      h('hr')
    )
  )


  for (let i = 0; i < appconf.navlinks.length; i++) {
    navsort.append(
      h('div.list-group-item',
        h('div.fas.fa-bars.handle.mr-4'),
        h('span.handled', appconf.navlinks[i])
      )
    )
  }

  document.getElementById('main-content').append(
    h('h3', 'Pages'),
    row_main,
    h('div#post_view_main'),
    h('div.col-12',
      h('hr'),
      h('h3', 'Navigation order')
    ),
    navsort
  );
  utils.nav_sort(document.getElementById('navsort'));
  ws.send({
    type: 'page_list'
  });
  window.removeEventListener('socket_ready', init, false);
}

window.addEventListener("page_list", function(evt) {
  evt = evt.detail;
  let items = h('div.row.mb-3');
  for (let i = 0; i < evt.length; i++) {

    items.append(
      h('div.col-4', h('p', evt[i].title)),
      h('div.form-group.col-4',
        h('div.input-group.input-group-sm',
          h('input#page_status_'+ evt[i].title +'.form-control', {
            type: 'text',
            value: evt[i].status,
            readOnly: true
          }),
          h('div.input-group-append',
            h('button.btn.btn-outline-secondary', {
              type: 'button',
              onclick: function(){
                let x = document.getElementById('page_status_'+ evt[i].title),
                obj = {};
                if(x.value === 'true'){
                  x.value = 'false';
                } else {
                  x.value = 'true';
                }
                obj.status = JSON.parse(x.value)
                obj.title = evt[i].title;
                return ws.send({type: 'page_status_update', data: obj})
              }
            }, 'toggle')
          )
        )
      ),
      h('div.col-4',
          h('button.btn.btn-sm.btn-outline-info.mr-2', {
            type: 'button',
            onclick: function(){
              ls.set('page_edit', evt[i]);
              location.href = '/pages/edit'
            }
          }, 'Edit'),
          function(){
            let nodel = ['home','contact', 'terms', 'sitemap'],
            ttl = evt[i].title,
            is_disabled = false;
            if(nodel.indexOf(ttl) !== -1){
              is_disabled = true;
            }
            return h('button.btn.btn-sm.btn-outline-danger', {
              type: 'button',
              disabled: is_disabled,
              onclick: function(){
                ws.send({
                  type: 'page_delete',
                  data: {
                    title: evt[i].title,
                    status: evt[i].status
                  }
                })
              }
            }, 'Delete')
          },
        )
      )
    }
    document.getElementById('post_view_main').append(items);

});


window.addEventListener('socket_ready', init, false)
