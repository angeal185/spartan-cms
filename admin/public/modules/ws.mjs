import { global as g } from  "/modules/global.mjs";
import { ls, ss } from  "/modules/storage.mjs";
import { utils } from  "/modules/utils.mjs";
import { cnsl } from  "/modules/cnsl.mjs";

let socket = new WebSocket('wss://localhost:'+ appconf.wsport);

const ws = {
  events: function(){
    ss.set('wss_conn', false)
    // Connection opened
    socket.addEventListener('open', function (evt) {
      ss.set('wss_conn', true);
      cnsl(['[ws]', 'connected /.>,<on port:', appconf.wsport], ['lime', 'cyan', 'magenta']);
      let event = new Event('socket_ready');
      window.dispatchEvent(event);
      if(!ls.get_b64('jwt') && location.pathname !== '/login'){
        return location.href = '/login'
      }
      if(location.pathname !== '/login'){
        utils.globe_change('wss', 'online');
      }
    });

    // wss reload
    socket.addEventListener('close', function (evt) {
      let cnt = 1;
      ss.set('wss_conn', false);
      cnsl(['[ws]', 'WebSocket closed,', 'reconnecting...'], ['red', 'cyan', 'magenta']);

      utils.globe_change('wss', 'offline');
      let reconnect = setInterval(function(){
        utils.globe_change('wss', 'reloading');

        socket = new WebSocket('wss://localhost:'+ appconf.wsport);
        socket.onopen = function(event) {
          cnsl(['[ws]', 'WebSocket reconnected.'], ['lime', 'cyan']);
          utils.globe_change('wss', 'online');
          clearInterval(reconnect);
          ws.events();
          ss.set('wss_conn', true)
        }
        socket.addEventListener('error', function (event) {
          if(cnt < appconf.ws_max_retry){
            cnsl(
              ['[ws]', 'reconnect attempt '+ cnt +' out of '+ appconf.ws_max_retry +' failed. ', 'retrying...'],
              ['red', 'cyan', 'magenta']
            );
            cnt++;
          } else {
            cnsl(['[ws]', 'max reconnect attempts exceeded, disconnecting.'], ['red', 'cyan']);
            clearInterval(reconnect);
          }
          return;

        });
      },1000)

    })

    // Listen for messages
    socket.addEventListener('message', function (evt) {
      evt = g.jp(evt.data)

      if(evt.type === 'login'){
        //utils.toast('info', evt.data);
        if(evt.code === 1 && location.pathname !== '/login'){
          return location.href = '/login';
        }

        if(evt.code === 1 && location.pathname === '/login'){
          return;
        }

        utils.toast('info', evt.data.msg);
      }

      if(evt.type === 'logout'){
        utils.toast('info', evt.data);
        setTimeout(function(){
          utils.logout();
        },1000)
      }

      if(evt.type === 'msg'){
        utils.add_alert(evt.data);
        utils.toast('info', evt.data);
        if(evt.reload){
          let rl = setInterval(function(){
            if(ss.get('wss_conn')){
              clearInterval(rl);
              location.reload();
            }
          },2000);
        }
      }

      if(evt.type === 'gallery_list'){
        var event = new CustomEvent("gallery_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'online_status'){
        utils.init_online_status(evt.data)
      }

      if(evt.type === 'post_list'){
        var event = new CustomEvent("post_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'subscribers_list'){
        var event = new CustomEvent("subscribers_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'contact_list'){
        var event = new CustomEvent("contact_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'restblacklist_list'){
        var event = new CustomEvent("restblacklist_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'news_list'){
        var event = new CustomEvent("news_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'dashboard'){
        var event = new CustomEvent("dashboard", {
          detail: evt.data
        });
        return window.dispatchEvent(event);
      }

      if(evt.type === 'page_list'){
        var event = new CustomEvent("page_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'file_get'){
        var event = new CustomEvent("file_get", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'safe_unlock'){
        var event = new CustomEvent("safe_unlock", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'safe_edit'){
        var event = new CustomEvent("safe_edit", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'markdown'){
        let event = new Event('markdown_parse');
        window.dispatchEvent(event);
      }

      if(evt.type === 'import_list'){
        var event = new CustomEvent("import_list", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'database_get'){
        var event = new CustomEvent("database_get", {
          detail: evt.data
        });
        document.getElementById('database_mode').value = evt.mode
        ss.set('database_mode', evt.mode);
        window.dispatchEvent(event);
      }

      if(evt.type === 'settings_get'){
        var event = new CustomEvent("settings_get", {
          detail: evt.data
        });
        document.getElementById('settings_mode').value = evt.mode
        ss.set('settings_mode', evt.mode);
        window.dispatchEvent(event);
      }

      if(evt.type === 'list_files'){
        var event = new CustomEvent("list_files", {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'markdown'){
        let event = new Event('markdown_parse'),
        dest = 'post_create_HTML'
        if(evt.dest === 'news'){
          dest = 'news_create_HTML'
        }
        ls.set(dest, evt.data)
        window.dispatchEvent(event);
      }

      if(evt.type === 'page_base'){
        let event = new CustomEvent('page_base', {
          detail: evt.data
        });
        ls.set('base_page', evt.data)
        window.dispatchEvent(event);
      }

      if(evt.type === 'markdown_tpl_load'){
        let event = new Event('markdown_tpl_load');
        ss.set('markdown_tpl_load', evt.data)
        window.dispatchEvent(event);
      }

      if(evt.type === 'min_css'){
        let event = new CustomEvent('min_css', {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'min_js'){
        let event = new CustomEvent('min_js', {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'feed_data'){
        let event = new CustomEvent('feed_data', {
          detail: evt.data
        });
        window.dispatchEvent(event);
      }

      if(evt.type === 'HTML_tpl_load'){
        let event = new Event('HTML_tpl_load');
        ss.set('HTML_tpl_load', evt.data)
        window.dispatchEvent(event);
      }

    });
  },
  send: function(i){
    if(location.pathname !== '/login'){
      if(!ls.get_b64('jwt')){
        return location.href = '/login'
      }
      i.jwt = ls.get_b64('jwt');
    }
    socket.send(g.js(i));
  }
}

export { ws }
