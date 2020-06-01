import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ss } from  "/modules/storage.mjs";
import { pagination } from  "/modules/pagination.mjs";


var init = function(){
  let row_main = h('div.row'),
  arr = ['title', 'date','author'];

  ss.set('pagtype', 'post')

  for (let i = 0; i < arr.length; i++) {
    row_main.append(h('div.col-3', arr[i]))
  }

  row_main.append(
    h('div.col-3',
      h('button.btn.btn-outline-danger.btn-sm',{
        type: 'button',
        onclick: function(){
          utils.confirm('delete all posts?', function(res){
            g.cl(res)
          })
        }
      }, 'Delete all')
    ),
    h('div.col-12',
      h('hr')
    )
  )


  document.getElementById('main-content').append(row_main, h('div#post_view_main'), h('div#pagination'))
  ws.send({type: 'post_list'})
  window.removeEventListener('socket_ready', init,false)
}

window.addEventListener("post_list", function(evt) {
  evt = evt.detail;

  let pagitems = utils.chunk(evt, 20)
  let max = pagitems.length;

  ss.set('pagitems', pagitems)

  pagination.page_select(pagitems[0])

  ss.set('pag-current', 1);
  ss.set('pag-max', max);
  let item;

  if(max < 6){
    item = h('ul.pagination');
    for (let i = 0; i < max; i++) {
      item.append(pagination.pageItem(max,g.js(i + 1)))
    }
  } else {
    item = h('ul.pagination',
      pagination.prevlink(max),
      pagination.pag_back(max),
      pagination.pageItem(max,'2'),
      pagination.pageItem(max,'3'),
      pagination.pageItem(max,'4'),
      pagination.pag_forw(max),
      pagination.nextlink(max)
    )
  }

  document.getElementById('pagination').append(
    item,h('div.pag-text', 'viewing page ', h('span#pagnum', '1'), ' of '+ max)
  )
});


window.addEventListener('socket_ready', init, false)
