import { global as g } from  "/app/modules/global.mjs";
import { h } from "/app/modules/h.mjs";
import { bs, ls,ss } from "/app/modules/storage.mjs";
import { utils } from "/app/modules/utils.mjs";

utils.get_theme(function(err){
  if(err){return console.log(err)}
  bs.get('config', function(err,config){
    if(err){return g.cl(err)}
    ss.set('page', 1);
    let rout = ls.get('rout'),
    doc_title = config.base_title + ': ' + utils.capitalize(rout) + ' feed';
    utils.toast('info', utils.capitalize(rout.replace(/_/g, ' ')) + ' feed');
    document.title = doc_title;
    utils.build_items(1, rout, function(err,data){
      if(err){return document.body.innerHTML = 'unable to fetch items at this time'}
      let max = ls.get(rout +'_pag').pagination.pages;

      document.body.append(
        utils.return_nav(config, doc_title),
        h('div#main-content.container-fluid.mb-2', data),
        h('div#paginate.container-fluid.mb-4',
          h('div.row',
            h('div.col-md-6',
              h('p', 'showing page ', h('span#pag-count', '1'), ' of '+ max)
            ),
            h('div.col-md-6.text-right',
              h('button.btn.btn-outline-secondary.btn-sm.mr-2.sh-95', {
                onclick: function(){
                  let page = ss.get('page'),
                  newpag = (page - 1),
                  main = document.getElementById('main-content');

                  if(page > 1){
                    utils.empty(main);
                    utils.build_items(newpag, rout, function(err,data){
                      main.append(data);
                      ss.set('page', newpag);
                      document.getElementById('pag-count').innerText = newpag;
                      utils.totop(80);
                    })
                  } else {
                    utils.toast('info', 'first page loaded');
                  }
                }
              }, 'Prev'),
              h('button.btn.btn-outline-secondary.btn-sm.sh-95', {
                onclick: function(){
                  let page = ss.get('page'),
                  newpag = (page + 1),
                  main = document.getElementById('main-content');

                  if(page < max){
                    utils.empty(main);
                    utils.build_items(newpag, rout, function(err,data){
                      main.append(data);
                      ss.set('page', newpag);
                      document.getElementById('pag-count').innerText = newpag;
                      utils.totop(80);
                    })
                  } else {
                    utils.toast('info', 'last page loaded');
                  }

                }
              }, 'Next')
            )
          )
        ),
        h('div#sub-content',
          utils.to_top(80)
        ),
        utils.return_footer(config)
      )
    })
  })
})
