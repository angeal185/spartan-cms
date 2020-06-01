import { global as g } from  "/app/modules/global.mjs";

if(!chrome || typeof chrome === undefined){
  chrome = browser;
}

const bs = {
  get: function(i,cb){
    chrome.storage.local.get(i, function(res){
      if(!res){return cb(undefined)}
      cb(false, res[i])
    })
  },
  set: function(i,cb){
    chrome.storage.local.set(i, function(err){
      if(err){return cb(err)}
      cb(false)
    })
  }
}
const ls = {
  get: function(i){
    try {
      return g.jp(g.LS.getItem(i))
    } catch (err) {
      return undefined;
    }
  },
  set: function(i,e){
    g.LS.setItem(i, g.js(e))
    return;
  },
  del: function(i){
    g.LS.removeItem(i);
  }
}

const ss = {
  get: function(i){
    try {
      return g.jp(g.SS.getItem(i))
    } catch (err) {
      return undefined;
    }
  },
  set: function(i,e){
    g.SS.setItem(i, g.js(e))
    return;
  },
  del: function(i){
    g.SS.removeItem(i);
  }
}

export { bs, ls, ss }
