import { global as g } from  "/app/modules/global.mjs";
import { h } from "/app/modules/h.mjs";
import { bs, ls,ss } from "/app/modules/storage.mjs";
import { utils } from "/app/modules/utils.mjs";

if(!chrome || typeof chrome === undefined){
  chrome = browser;
}

utils.get_theme(function(err, theme){
  if(err){return console.log(err)}
  utils.toast('info', 'config');
  bs.get('config', function(err,config){
    if(err){return g.cl(err)}
    const mani = chrome.runtime.getManifest();

    let doc_title = config.base_title + ': config';
    document.title = doc_title;

    console.log(mani)

    let theme_opt = config.theme.options,
    theme_sel = h('select.custom-select', {
      size: 6,
      onchange: function(){
        let val = this.value;
        let base_url = config.theme.base_url.replace(/{{theme}}/, val)
        utils.set_theme(base_url, val, function(err){
          utils.get_theme(function(err){
            if(err){return console.log(err)}
              utils.toast('success','theme updated');
              document.getElementById('current_theme').value = val;
          })
        })
      }
    }),
    theme_item = h('option'),
    ext_obj = {
      title: mani.name.replace(/_/g, ' '),
      description: mani.description,
      homepage: mani.homepage_url,
      author: mani.author,
      current_version: mani.version,
      latest_version: ls.get('latest_version')
    },
    ext_div = h('div.row'),
    item;

    for (let i = 0; i < theme_opt.length; i++) {
      item = theme_item.cloneNode();
      item.value = theme_opt[i];
      item.innerText = theme_opt[i];
      theme_sel.append(item)
    }

    for (let val in ext_obj) {
      ext_div.append(utils.return_input(val.replace(/_/, ' '),ext_obj[val]))
    }

    ext_div.append(h('div.col-12',
      utils.return_btn('Check for updates', function(){
        utils.get(config.version_url, function(err,res){
          if(err){
            console.log(err)
            return utils.toast('danger', 'unable to check for updates');
          }
          if(utils.version_check(mani.version, res.version) !== false){
            utils.toast('info', 'update available');
            setTimeout(function(){
              location.reload();
            },3000)
          } else {
            return utils.toast('success', 'up to date');
          }
        })
      })
    ))

    document.body.append(
      utils.return_nav(config, doc_title),
      h('div#main-content.container-fluid.mb-2',
        h('h3', 'Theme'),
        h('div.row',
          h('div.col-lg-6',
            h('div.form-group',
              h('label', 'Select theme'),
              theme_sel
            )
          ),
          h('div.col-lg-6',
            h('div.form-group',
              h('label', 'Current theme'),
              h('input#current_theme.form-control.mb-4', {
                value: theme,
                readOnly: true
              }),
              utils.return_btn('Reset', function(){
                utils.set_theme(config.theme.base_theme, 'bootstrap', function(err){
                  utils.get_theme(function(err){
                    if(err){return console.log(err)}
                      utils.toast('success','theme updated');
                      document.getElementById('current_theme').value = 'bootstrap';
                  })
                })
              })
            )
          )
        ),
        h('h3', 'Extention'),
        ext_div
      ),

      h('div#sub-content',
        utils.to_top(80)
      ),
      utils.return_footer(config)
    )

  })
})
