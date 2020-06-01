const NodeCache = require('node-cache'),
nc = new NodeCache();

const ncache = {
  set: function(key, val){
    try {
      return nc.set(key, val);
    } catch(err){
      if(err){return;}
    }
  },
  get: function(key){
    try {
      let val = nc.get(key);
      if (val === undefined){
        val = null;
      }
      return val;
    } catch (err) {
      if(err){return;}
    }
  }
}

module.exports = ncache;
