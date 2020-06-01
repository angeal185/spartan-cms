const cnf = require('./config'),
utils = require('./lib/utils'),
pkg = require('./package');

const plugin = {
  test: function(data, cb){
    try {
      console.log(data);
      cb(false, {
        test: 'working'
      })
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  update_config: function(obj){
    utils.update_config(obj, function(err){
      if(err){return console.error(err)}
    })
  },
  update_items: function(obj){
    
  }
}

module.exports = plugin
