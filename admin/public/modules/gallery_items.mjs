import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";

var init = function(){

  let new_item = {},
  gal_div = h('div'),
  row_main = h('div.row',
    h('div.col-6',
      h('div.form-group',
        h('input.form-control', {
          type: 'text',
          placeholder: 'title',
          onkeyup: function(){
            new_item.title = this.value;
          }
        })
      )
    ),
    h('div.col-6',
      h('div.form-group',
        h('input.form-control', {
          type: 'text',
          placeholder: 'url',
          onkeyup: function(){
            new_item.url = this.value;
          }
        })
      )
    ),
    h('div.col-10',
      h('div.form-group',
        h('input.form-control', {
          type: 'text',
          placeholder: 'description',
          onkeyup: function(){
            new_item.description = this.value;
          }
        })
      )
    ),
    h('div.col-2',
      h('button.btn.btn-sm.btn-outline-info.float-right', {
        type: 'button',
        onclick: function(){
          if(!new_item.title || new_item.title === ''){
            return utils.toast('danger', 'title cannot be empty')
          }
          if(!new_item.url || new_item.url === ''){
            return utils.toast('danger', 'url cannot be empty')
          }
          if(!new_item.description || new_item.description === ''){
            return utils.toast('danger', 'description cannot be empty')
          }
          ws.send({
            type: 'gallery_add',
            data: new_item
          })
        }
      }, 'Add New'),
    ),
    h('div.col-12',
      h('hr')
    )
  )

  document.getElementById('main-content').append(
    h('h3', 'Gallery Items'),
    row_main,
    gal_div
  );


  window.addEventListener("gallery_list", function(evt) {
    evt = evt.detail;
    let items = h('div.list-group.mb-3');
    for (let i = 0; i < evt.length; i++) {

      items.append(
        h('div.list-group-item',
          h('div.row',
            h('div.col-8', h('p', evt[i].title)),
            h('div.col-4', h('p.text-right',
              utils.ts2datetime(evt[i].date))
            ),
            h('div.col-8', h('input.form-control',{
              value: evt[i].description,
              readOnly: true
            })),
            h('div.col-4',
              h('span.float-right',
                h('button.btn.btn-sm.btn-outline-info.mr-2', {
                  type: 'button',
                  title: evt[i].url,
                  onclick: function(){
                    window.open(evt[i].url)
                  }
                }, 'Test'),
                h('button.btn.btn-sm.btn-outline-danger', {
                  type: 'button',
                  onclick: function(){
                    ws.send({
                      type: 'gallery_del',
                      data: evt[i].date
                    })
                  }
                }, 'Delete')
              )
            )
          )
        )
      )
    }
    gal_div.append(items);

  });

  ws.send({
    type: 'gallery_list'
  });
  window.removeEventListener('socket_ready', init, false);
}



window.addEventListener('socket_ready', init, false)
