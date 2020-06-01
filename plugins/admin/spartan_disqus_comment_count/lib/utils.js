const config = require('../config'),
db = require('../../../../admin/utils/db'),
fs = require('fs');

const utils = {
  update_comments: function(arr, cb){

  },
  update_config: function(obj, cb){
    const dest = [config.base_url, 'config/index.json'].join('/');
    fs.writeFile(dest, JSON.stringify(obj,0,2), function(err){
      if(err){return cb(err)}
      cb(false, {msg: 'config update success'})
    })
  },
  remove: function(){
    
  }
}

module.exports = utils;
