import { global as g } from  "/modules/global.mjs";
import { h } from "/modules/h.mjs";
import { utils } from "/modules/utils.mjs";
import { ws } from  "/modules/ws.mjs";
import { ss,ls } from  "/modules/storage.mjs";
import { tpl } from  "/modules/tpl.mjs";

const pagination = {
  set_active: function(item, max){

    let items = document.getElementsByClassName('pag-num');
    for (let i = 0; i < items.length; i++) {
      items[i].parentNode.classList.remove('active')
    }

    item.parentNode.classList.add('active');
    document.getElementById('pagnum').innerText = item.innerText;

  },
  pag_back: function(max){
    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(){
          if(ss.get('pag-current') === 1){
            return;
          }

          let items = document.getElementsByClassName('pag-num');

          if(ss.get('pag-current') !== 2 && parseInt(items[0].innerText) !== 1){
            for (let i = 0; i < items.length; i++) {
              items[i].innerText = parseInt(items[i].innerText) - 1;
            }
            pagination.set_active(items[1])
            items = parseInt(items[1].innerText);
          } else {
            pagination.set_active(items[0])
            items = parseInt(items[0].innerText);
          }

          ss.set('pag-current', items);

          pagination.page_select(pagination.get_page(items))

        }
      },'1')
    )
    return item;
  },
  pageItem: function(max, i){

    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(){
          let items = parseInt(this.innerText);
          if(ss.get('pag-current') === items){
            return;
          }

          ss.set('pag-current', items)
          pagination.page_select(pagination.get_page(items))
          pagination.set_active(this)

        }
      },i)
    )
    return item;
  },
  pag_forw: function(max){
    let item = h('li.page-item',
      h('a.page-link.pag-num', {
        onclick: function(){
          let items = document.getElementsByClassName('pag-num');
          if(ss.get('pag-current') === max){
            return;
          }

          if(ss.get('pag-current') !== (max - 1) && parseInt(items[4].innerText) !== max){
            for (let i = 0; i < items.length; i++) {
              items[i].innerText = parseInt(items[i].innerText) + 1;
            }
            pagination.set_active(items[3])
            items = parseInt(items[3].innerText);
          } else {
            pagination.set_active(items[4])
            items = parseInt(items[4].innerText);
          }

          ss.set('pag-current', items);
          pagination.page_select(pagination.get_page(items))


        }
      },'5')
    )

    return item;
  },
  prevlink: function(max){
    let item = h('li.page-item',
      h('a.page-link', {
        onclick: function(){
          let items = document.getElementsByClassName('pag-num');
          if(ss.get('pag-current') === 1 || parseInt(items[0].innerText) < 5){
            return;
          }

          for (let i = 0; i < items.length; i++) {
            items[i].innerText = parseInt(items[i].innerText) - 5;
          }

          pagination.set_active(items[4])
          items = parseInt(items[4].innerText);
          ss.set('pag-current', items);
          pagination.page_select(pagination.get_page(items))

        }
      },'Prev')
    )

    return item;
  },
  nextlink: function(max){
    let item = h('li.page-item',
      h('a.page-link', {
        onclick: function(){
          let items = document.getElementsByClassName('pag-num');
          if(ss.get('pag-current') === max  || parseInt(items[4].innerText) > (max - 5)){
            return;
          }

          for (let i = 0; i < items.length; i++) {
            items[i].innerText = parseInt(items[i].innerText) + 5;
          }

          pagination.set_active(items[0])
          items = parseInt(items[0].innerText)
          ss.set('pag-current', items)
          pagination.page_select(pagination.get_page(items))

        }
      },'Next')
    );

    return item;
  },
  page_select: function(evt){

    let listmain = h('div.list-group'),
    pagtype = ss.get('pagtype');

    utils.clear(pagtype +'_view_main');

    for (let x = 0; x < evt.length; x++) {
      let listul = h('div.list-group-item',
        h('div.row.mb-2')
      );

      if(pagtype === 'subscribers'){
        let arr = [evt[x].name, evt[x].email, utils.ts2datetime(evt[x].date)];
        for (let i = 0; i < arr.length; i++) {
          listul.firstChild.append(h('div.col-3', arr[i]))
        }
        listul.firstChild.append(tpl.pag_subscribers(pagtype, evt[x]))
      } else if(pagtype === 'news' || pagtype === 'post' ){
        let arr = [evt[x].title, utils.ts2datetime(evt[x].date), evt[x].author];

        for (let i = 0; i < arr.length; i++) {
          listul.firstChild.append(h('div.col-3', arr[i]))
        }

        listul.firstChild.append(tpl.pag_post(pagtype, evt[x]))
      } else if(pagtype === 'contact' ){

        let inp_item = h('input.form-control',{
          type: 'text',
          readOnly: true
        }),
        text_item = h('textarea.form-control',{
          readOnly: true
        }),
        dest_item;

        for (let val in evt[x]) {
          if(val === 'date'){
            evt[x].date = utils.ts2datetime(evt[x].date)
          }
          if(val === 'msg'){
            dest_item = text_item.cloneNode();
          } else {
            dest_item = inp_item.cloneNode();
          }

          dest_item.value = evt[x][val];

          listul.firstChild.append(
            h('div.col-6',
              h('div.form-group',
                h('label', val),
                dest_item
              )
            )
          )

        }

        dest_item = null;

        listul.firstChild.append(tpl.pag_contact(pagtype, evt[x]))
      }


      listmain.append(listul)
    }

    document.getElementById(pagtype +'_view_main').append(listmain)
  },
  get_page: function(i){
    return ss.get('pagitems')[i-1]
  }
}

export { pagination }
