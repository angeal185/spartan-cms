import { editor as edt } from '/modules/editor.mjs';
import { global as g } from  "/modules/global.mjs";
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls, ss } from  "/modules/storage.mjs";

var init = function(){

  window.addEventListener('feed_data', function (feedcnf) {
    feedcnf = feedcnf.detail;
    ss.set('feed_types', feedcnf.types);
    ss.set('feed_compression', feedcnf.compression);

    let feed_select = h('select.form-control', {
      size: 6
    }),
    feed_select2 = feed_select.cloneNode(true),
    feed_select3 = feed_select.cloneNode(true),
    feed_select4 = feed_select.cloneNode(true),
    feed_select5 = feed_select.cloneNode(true),
    feed_select6 = feed_select.cloneNode(true),
    feed_select7 = feed_select.cloneNode(true),
    feed_select8 = feed_select.cloneNode(true),
    feed_select9 = feed_select.cloneNode(true),
    feed_select10 = feed_select.cloneNode(true),
    feedarr = feedcnf.types,
    setarr = [{
      dest: feed_select,
      type: 'post_dump',
      ext: false
    },{
      dest: feed_select,
      type: 'post_dump',
      ext: 'tgz'
    },{
      dest: feed_select,
      type: 'post_dump',
      ext: 'zip'
    },{
      dest: feed_select2,
      type: 'post_recent',
      ext: false
    },{
      dest: feed_select2,
      type: 'post_recent',
      ext: 'tgz'
    },{
      dest: feed_select2,
      type: 'post_recent',
      ext: 'zip'
    },{
      dest: feed_select3,
      type: 'news_dump',
      ext: false
    },{
      dest: feed_select3,
      type: 'news_dump',
      ext: 'tgz'
    },{
      dest: feed_select3,
      type: 'news_dump',
      ext: 'zip'
    },{
      dest: feed_select4,
      type: 'news_recent',
      ext: false
    },{
      dest: feed_select4,
      type: 'news_recent',
      ext: 'tgz'
    },{
      dest: feed_select4,
      type: 'news_recent',
      ext: 'zip'
    },{
      dest: feed_select5,
      type: 'gallery_dump',
      ext: false
    },{
      dest: feed_select5,
      type: 'gallery_dump',
      ext: 'tgz'
    },{
      dest: feed_select5,
      type: 'gallery_dump',
      ext: 'zip'
    }]

    for (let i = 0; i < feedarr.length; i++) {
      for (let x = 0; x < setarr.length; x++) {
        setarr[x].dest.append(
          utils.append_feed_item(feedarr[i], {type: setarr[x].type, ext: setarr[x].ext}, feedcnf)
        )
      }
    }

    function return_input(id, text){
      return h('input#'+ id +'.form-control.mb-2', {
        type: 'text',
        readOnly: true,
        placeholder: text
      })
    }

    function return_row(sel, x, text){
      return h('div',
        h('div.row',
          h('div.col-6',
            h('h3', utils.capitalize(x) +' feed')
          ),
          h('div.col-md-6',
            h('span.float-left', 'updated '+ feedcnf.update_timespan[x]),
              h('a#'+ x +'_download.float-right.cp',{
                onclick: function(){
                  if(!ss.get(x + '_feed')){
                    return;
                  }
                  let obj = {
                    type: x,
                    ext: ss.get(x + '_feed')
                  }
                  ws.send({type: 'feed_update', data: obj});
                  return;
                }
              }, 'update')
          )
        ),
        h('div.row',
          h('div.col-md-6',
            h('div.form-group',
              sel
            )
          ),
          h('div.col-md-6',
            h('div.form-group',
              return_input('blog_'+ x +'_url', 'GET endpoint'),
              return_input('blog_'+ x +'_hash', 'SHA3-512'),
              h('div.row',
                h('div.col-6',
                  h('div.form-group',
                    return_input('blog_'+ x +'_size', 'size')
                  )
                ),
                h('div.col-6',
                  h('div.form-group',
                    return_input('blog_'+ x +'_date', 'date')
                  )
                )
              )
            )
          )
        )
      )
    }

    let freq = ['hourly', 'daily', 'weekly', 'monthly'],
    ftypes = ['json', 'xml', 'csv'],
    ctypes = ['gz', 'tgz', 'zip'],
    typecnf = h('div.form-group.mt-4',
      h('h6', 'feed types')
    ),
    typecnf2 = h('div.form-group.mt-4',
      h('h6', 'compression types')
    ),
    stoggle = true

    function return_cnf(stoggle, stypes, item){
      return h('input.form-check-input:checked', {
        type: 'checkbox',
        value: stoggle,
        checked: stoggle,
        onclick: function(){
          let val = this.value,
          itypes = ss.get(stypes),
          arr = [];

          if(val === 'true'){
            this.value = 'false'
            for (let x = 0; x < itypes.length; x++) {
              if(itypes[x] !== item){
                arr.push(itypes[x])
              }
            }
            ss.set(stypes, arr);
          } else {
            this.value = 'true';
            itypes.push(item)
            ss.set(stypes, itypes);
            arr = itypes;
          }

          ws.send({type: stypes, data:arr});
        }
      }, item);
    }

    for (let i = 0; i < ftypes.length; i++) {
      if(feedcnf.types.indexOf(ftypes[i]) === -1){
        stoggle = false;
      } else {
        stoggle = true;
      }
      typecnf.append(
        h('div.form-check.form-check-inline',
          return_cnf(stoggle, 'feed_types', ftypes[i]),
          h('label.form-check-label.ml-2', ftypes[i])
        )
      )
    }

    for (let i = 0; i < ctypes.length; i++) {
      if(feedcnf.compression.indexOf(ctypes[i]) === -1){
        stoggle = false;
      } else {
        stoggle = true;
      }
      typecnf2.append(
        h('div.form-check.form-check-inline',
          return_cnf(stoggle, 'feed_compression', ctypes[i]),
          h('label.form-check-label.ml-2', ctypes[i])
        )
      )
    }


    for (let i = 0; i < freq.length; i++) {
      feed_select6.append(h('option', {value: freq[i]}, freq[i]));
      feed_select7.append(h('option', {value: freq[i]}, freq[i]));
      feed_select8.append(h('option', {value: freq[i]}, freq[i]));
      feed_select9.append(h('option', {value: freq[i]}, freq[i]));
      feed_select10.append(h('option', {value: freq[i]}, freq[i]));
    }

    feed_select6.addEventListener('change', function(){
      utils.update_timespan(this.value, 'post_dump');
    })

    feed_select7.addEventListener('change', function(){
      utils.update_timespan(this.value, 'post_recent');
    })

    feed_select8.addEventListener('change', function(){
      utils.update_timespan(this.value, 'news_dump');
    })

    feed_select9.addEventListener('change', function(){
      utils.update_timespan(this.value, 'news_recent');
    })

    feed_select10.addEventListener('change', function(){
      utils.update_timespan(this.value, 'gallery_dump');
    })


    document.getElementById('main-content').append(h('div.feeddiv',
      return_row(feed_select, 'post_dump'),
      return_row(feed_select2, 'post_recent'),
      return_row(feed_select3, 'news_dump'),
      return_row(feed_select4, 'news_recent'),
      return_row(feed_select5, 'gallery_dump'),
      h('div.row',
        h('div.col-6',
          h('h3', 'post dump feed timespan'),
          feed_select6
        ),
        h('div.col-6',
          h('h3', 'post recent feed timespan'),
          feed_select7
        ),
        h('div.col-6',
          h('h3', 'news dump feed timespan'),
          feed_select8
        ),
        h('div.col-6',
          h('h3', 'news recent feed timespan'),
          feed_select9
        ),
        h('div.col-6',
          h('h3', 'gallery dump feed timespan'),
          feed_select10
        )
      ),

      h('div.row',
        h('div.col-6',
          typecnf
        ),
        h('div.col-6',
          typecnf2
        )
      )

    ))

  }, false);

  ws.send({type: 'feed_data'});
  window.removeEventListener('socket_ready', init, false);
}


window.addEventListener('socket_ready', init, false);
