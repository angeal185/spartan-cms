import  './ace/ace.js';

var editor = {
  init: function(i, cb){
    try {
      let instance = ace.edit(i.ele);
      ace.config.set('basePath', '/modules/ace')
      appconf.ace.mode = "ace/mode/"+ i.mode;
      instance.setOptions(appconf.ace)
      cb(false, instance)
    } catch (err) {
      if(err){return cb(err, null)}
    }
  },
  base: ace
}

export { editor };
