import { urls } from './urls.mjs';
import { utils } from  "/modules/utils.mjs";

const plugin_utils = {
  post_action: function(obj, cb){
    let dest = location.href;
    fetch(dest, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'same-origin',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(obj)
    })
    .then(function(res) {
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    }).then(function(data) {
      cb(false, data)
    }).catch(function(err){
      cb(err)
    })
  },
  fetch_comments: function(config, pag, cb){
    let durl = urls.disqus + '?&forum='+config.settings.src+'&limit=100&api_key='+ config.settings.api;
    if(pag){
      durl+= '&cursor='+ pag;
    }
    fetch(durl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      }
    })
    .then(function(res) {
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {

      let event = new CustomEvent("discus_items_update", {
        detail: data.response
      });
      window.dispatchEvent(event);
      if(data.cursor.hasNext){
        console.log('hasnext')
        plugin_utils.fetch_comments(config, data.cursor.next, function(err, res){
          if(err){return cb(err)}
          utils.toast('success', 'all items loaded')
          cb(false)
        })
      } else {
        cb(false)
      }
    })
    .catch(function(err){
      cb(err)
    })
  },
  get_config: function(cb){
    const dest = urls.config;
    fetch(dest, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'Sec-Fetch-Dest': 'object',
        'Sec-Fetch-mode': 'same-origin',
        'Sec-Fetch-Site': 'same-origin'
      }
    })
    .then(function(res) {
      if (res.status >= 200 && res.status < 300) {
        return res.json();
      } else {
        return Promise.reject(new Error(res.statusText))
      }
    })
    .then(function(data) {
      cb(false, data)
    })
    .catch(function(err){
      cb(err)
    })
  },
  update_items: function(items, cb){
    try {
      let arr = [],
      obj = {};
      for (let i = 0; i < items.length; i++) {
        if(!items[i].isSpam && !items[i].isDeleted && !items[i].isClosed){
          obj.id = items[i].link.split('/').pop();
          obj.comments = items[i].posts;
          obj.comment_rss = items[i].feed;
          obj.likes = items[i].likes;
          obj.dislikes = items[i].dislikes;
          arr.push(obj);
          obj = {};
        }
      }
      obj = null;
      console.log(JSON.stringify(arr))
    } catch (err) {
      cb(err)
    }
  }
}

export { plugin_utils }
