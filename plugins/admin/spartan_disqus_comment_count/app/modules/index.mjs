import { h } from '/modules/h.mjs';
import { utils } from  "/modules/utils.mjs";
import { plugin_utils } from './plugin_utils.mjs';
import  "/js/jsoneditor.js";

utils.addCSS('jsoneditor');

plugin_utils.get_config(function(err, config){
  if(err){return console.log(err)}

  let main = document.getElementById('main-content'),
  jsneditor = h('div'),
  api_inp = h('input.form-control',{
    type: 'password',
    value: config.settings.api,
    onkeyup: utils.debounce(function(evt){
      let val = evt.target.value
      if(val === config.settings.api){
        return;
      }
      config.settings.api = val;
      plugin_utils.post_action({fn: 'update_config', data: config}, function(err, res){
        if(err){return console.log(err)}
        console.log(res)
        utils.toast('success','api key updated')
      })
    },1000, false)
  }),
  items_edit = new JSONEditor(jsneditor, {
    modes: ['text', 'tree', 'form'],
    mode: 'form',
    onChangeText: function(i){
      console.log(i)
    }
  }),
  main_div = h('div.container-fluid',
    h('div.row',
      h('div.col-md-6',
        h('div.form-group',
          h('label', 'Discus api key'),
          h('div.input-group.mb-4',
            api_inp,
            h('div.input-group-append',{
                onclick: function(){
                  if(api_inp.type === 'text'){
                    api_inp.type = 'password';
                  } else {
                    api_inp.type = 'text';
                  }
                }
              },
              h('span.input-group-text.fas.fa-eye')
            )
          )
        )
      ),
      h('div.col-md-6',
        h('div.form-group',
          h('label', 'test'),

        )
      ),
      h('div.col-12',
        jsneditor,
        h('button.btn.btn-outline-secondary.mt-4.float-right', {
          onclick: function(){
            let items = items_edit.get().items;
            plugin_utils.update_items(items, function(err){
              console.error(err)
              if(err){return utils.toast('danger', 'items update failed')}
            })
          }
        }, 'update')
      )
    )
  );

  items_edit.set({items:[]});

  window.addEventListener('discus_items_update', function (evt) {
    let data = items_edit.get();
    console.log(data)
    data.items = data.items.concat(evt.detail)
    items_edit.set(data);
  })

  main.append(
    main_div
  )

  //return
  plugin_utils.fetch_comments(config, false, function(err, res){
    if(err){return console.log(err)}
  })

})
