import { global as g } from "/modules/global.mjs";
import { editor as edt } from '/modules/editor.mjs';
import { ws } from "/modules/ws.mjs";
import { h } from "/modules/h.mjs";
import { utils } from "/modules/utils.mjs";
import { ls,ss } from "/modules/storage.mjs";

import { apex } from "/modules/apex/apex.mjs";

var init = function() {

  function dash_card(obj) {

    return h('div.col-md-4.mb-4',
      h('div.card.border-left-primary.shadow.h-100.py-2',
        h('div.card-body',
          h('div.row.no-gutters.align-items-center',
            h('div.col.mr-2',
              h('h4', obj.item),
              h('h6', 'count: ' + obj.len),
              h('h6', 'size: ' + obj.size + 'b')
            ),
            h('div.col-auto',
              h('i.fas.fa-2x.text-gray-300.fa-' + obj.ico)
            )
          )
        )
      )
    )
  }

  window.addEventListener('dashboard', function(evt) {
    evt = evt.detail;
    let main = document.getElementById('main-content'),
      row_main = h('div.row'),
      items_chart_div = h('div.col-md-6'),
      user_chart_div = items_chart_div.cloneNode(),
      post_cat_div = items_chart_div.cloneNode(),
      post_tag_div = items_chart_div.cloneNode(),
      subscription_div = items_chart_div.cloneNode(),
      hr = h('hr.mb-4'),
      user_arr = [],
      user_post_arr = [],
      user_news_arr = [],
      post_obj = {
        cat: [],
        cat_len: [],
        tag: [],
        tag_len: []
      },
      obj;


      for (let i = 0; i < evt.tagcat.cat_len.length; i++) {
        post_obj.cat.push(evt.tagcat.cat_len[i].item);
        post_obj.cat_len.push(evt.tagcat.cat_len[i].count)
      }

      for (let i = 0; i < evt.tagcat.tag_len.length; i++) {
        post_obj.tag.push(evt.tagcat.tag_len[i].item);
        post_obj.tag_len.push(evt.tagcat.tag_len[i].count)
      }

    for (let i in evt) {
      if (['pages', 'posts', 'news', 'blacklist', 'subscribers', 'unsubscribers', 'gallery'].indexOf(i) !== -1) {
        obj = evt[i];
        obj.item = i;
        obj.ico = 'chart-bar';
        row_main.append(dash_card(obj))
      }
    }

    for (let i in evt.author) {
      user_arr.push(i)
      user_post_arr.push(evt.author[i].posts)
      user_news_arr.push(evt.author[i].news)
    }

    obj.expires = ls.get_b64('jwt').expires;
    obj.start = (obj.expires - appconf.duration)

    main.append(
      h('h3', document.title),
      h('div.row',
        h('div.col-md-6.mb-4',
          h('div.card.border-left-primary.shadow.h-100.py-2',
            h('div.card-body',
              h('div.row.no-gutters.align-items-center',
                h('div.col.mr-2',
                  h('h4', 'session status'),
                  h('h6', 'session start: ' + utils.ts2datetime(obj.start)),
                  h('h6', 'session expires: ' + utils.ts2datetime(obj.expires)),
                  h('h6', 'session remaining: ', h('span#session_remain'))
                ),
                h('div.col-auto',
                  h('i.fas.fa-2x.text-gray-300.fa-lock')
                )
              )
            )
          )
        ),
        h('div.col-md-6.mb-4',
          h('div.card.border-left-primary.shadow.h-100.py-2',
            h('div.card-body',
              h('div.row.no-gutters.align-items-center',
                h('div.col.mr-2',
                  h('h4', 'session log'),
                  h('h6', 'last login: ' + utils.ts2datetime(evt.last_login)),
                  h('h6', 'total logins: ' + evt.total_login),
                  h('h6', 'failed logins: ' + evt.login_attempts)
                ),
                h('div.col-auto',
                  h('i.fas.fa-2x.text-gray-300.fa-lock')
                )
              )
            )
          )
        )
      ),
      hr.cloneNode(),
      row_main,
      hr.cloneNode(),
      h('div.row',
        items_chart_div,
        user_chart_div,
        post_cat_div,
        post_tag_div,
        subscription_div
      )
    );


    apex.return_bar_a({
      text: 'Blog stats',
      series: [{
        name: 'Posts',
        data: evt.posts.post_year
      }, {
        name: 'News',
        data: evt.news.post_year
      }],
      labels: post_obj.cat,
      categories: ['jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'nov', 'dec'],
      y_text: ['Year', utils.get_year(Date.now())].join(' '),
      formatter: 'items total',
      dest: items_chart_div
    })

    apex.return_bar_b({
      text: 'Author stats',
      series: [{
        name: 'Posts',
        data: user_post_arr
      }, {
        name: 'News',
        data: user_news_arr
      }],
      categories: user_arr,
      formatter: 'items total',
      dest: user_chart_div
    })

    apex.return_donut({
      text: 'Post category stats',
      series: post_obj.cat_len,
      labels: post_obj.cat,
      formatter: 'items total',
      dest: post_cat_div
    })

    apex.return_donut({
      text: 'Post tags stats',
      series: post_obj.tag_len,
      labels: post_obj.tag,
      formatter: 'items total',
      dest: post_tag_div
    })

    apex.return_donut({
      text: 'Subscription stats',
      series: [evt.subscribers.len, evt.unsubscribers.len],
      labels: ['Subscribed', 'Unsubscribed'],
      formatter: 'person total',
      dest: subscription_div
    })

    void
    function() {
      let dest = document.getElementById('session_remain');
      setInterval(function() {
        let count = Math.floor(((obj.expires - Date.now()) / 1000));
        if (count < 1) {
          return location.href = '/login'
        }
        dest.innerText = [(count - 1), 's'].join('')
      }, 1000)
    }()



  })

  ws.send({
    type: 'dashboard'
  })


  window.removeEventListener('socket_ready', init, false);


}



window.addEventListener('socket_ready', init, false)
