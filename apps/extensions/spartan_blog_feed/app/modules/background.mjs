import { utils } from "/app/modules/utils.mjs";

utils.config_check(function(config){
  utils.set_theme(config.theme.base_theme, 'bootstrap', function(err){
    if(err){return console.log(err);}
  })
})
