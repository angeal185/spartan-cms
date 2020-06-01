import { global as g } from  "/app/modules/global.mjs";
import { h } from "/app/modules/h.mjs";
import { bs,ls,ss } from "/app/modules/storage.mjs";
import { utils } from "/app/modules/utils.mjs";


utils.get_theme(function(err){
  if(err){return console.log(err)}
  let docbody = document.body;
  utils.is_online(function(result){
    if(result){
      bs.get('config', function(err,config){
        if(err){return g.cl(err)}
        bs.get('subscribed', function(err,subscribed){
          if(err){return g.cl(err)}
          let list_div = h('div.list-group.mt-4.mb-4'),
          src;

          for (let i = 0; i < subscribed.length; i++) {
            src = config.base_url + config.urls[subscribed[i]] + 'index.json';
            utils.get(src, function(err, res){
              let current = ls.get(subscribed[i]+ '_pag'),
              col = 'secondary';
              if(!current  ||  current.pagination.count !== res.pagination.count){
                col = 'success';
              }
              ls.set(subscribed[i]+ '_pag', res);

              list_div.append(
                utils.list_item(subscribed[i], subscribed[i], res.pagination.count, col, false)
              )

              if(i === (subscribed.length - 1)){
                docbody.classList.add('w400');
                docbody.append(
                  utils.return_nav(config, config.base_title),
                  h('div.container-fluid',
                    list_div
                  )
                )

                let cat_items = h('div.mt-4.hidden'),
                news_items = cat_items.cloneNode(true);

                src = config.base_url + config.urls.catlist;

                utils.get(src, function(err, res){
                  if(err){return g.cl(err)};
                  let ttl;
                  for (let i = 0; i < res.cat_len.length; i++) {
                    ttl = res.cat_len[i].item;

                    cat_items.append(
                      utils.list_item(ttl, 'posts_category', res.cat_len[i].count, 'secondary', ttl)
                    )
                  }

                  for (let i = 0; i < res.news_len.length; i++) {
                    ttl = res.news_len[i].item;
                    news_items.append(
                      utils.list_item(ttl, 'news_category', res.news_len[i].count, 'secondary', ttl)
                    )
                  }

                  function return_cat_list(title, links){
                    return h('div.list-group-item.mainlink',
                      title,
                      h('span.icon-right-open.float-right.mr-2.cp', {
                        onclick: function(){
                          this.classList.toggle('icon-right-open');
                          this.classList.toggle('icon-down-open')
                          this.parentNode.lastChild.classList.toggle('hidden')
                        }
                      }),
                      links
                    )
                  }

                  docbody.append(
                    h('div.container-fluid',
                      h('div.list-group',
                        return_cat_list('Post categories', cat_items),
                        return_cat_list('News categories', news_items)
                      )
                    ),
                    utils.return_footer(config)
                  )

                })

              }
            })
          }
        })
      })

    } else {
      docbody.classList.add('bg-dark');
      docbody.append(
        h('div.container-fluid',
          h('div.card.bg-danger.text-dark.mt-3.mb-3',
            h('div.card-body',
              h('p.card-text', 'internet connection required')
            )
          )
        )
      )
    }
  })
})
