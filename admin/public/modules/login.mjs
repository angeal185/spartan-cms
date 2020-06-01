import { global as g } from  "/modules/global.mjs";
import { h } from  "/modules/h.mjs";
import { Particles } from  "/modules/ani/particle.mjs";

let socket = new WebSocket('wss://localhost:'+ appconf.wsport);

var utils = {
    send: function(i){
      if(location.pathname !== '/login'){
        if(!ls.get_b64('jwt')){
          return location.href = '/login'
        }
        i.jwt = ls.get_b64('jwt');
      }
      socket.send(g.js(i));
    },
    events: function(){

      socket.addEventListener('open', function (evt) {
        console.log('ws connected on port: '+ appconf.wsport)
        let event = new Event('socket_ready');
        window.dispatchEvent(event);
        if(!utils.get_b64('jwt') && location.pathname !== '/login'){
          return location.href = '/login'
        }
      });

      // wss reload
      socket.addEventListener('close', function (evt) {
        let msg = 'WebSocket closed, reconnecting...';
        let reconnect = setInterval(function(){
          socket = new WebSocket('wss://localhost:'+ appconf.wsport);
          socket.onopen = function(event) {
            msg = 'WebSocket reconnected';
            clearInterval(reconnect);
            utils.events();
          }
        },1000)

      })

      socket.addEventListener('message', function (evt) {
        evt = g.jp(evt.data)
        if(evt.type === 'login'){
          if(evt.code === 1 && location.pathname !== '/login'){
            return location.href = '/login';
          }

          if(evt.code === 1 && location.pathname === '/login'){
            return;
          }

          delete evt.data.msg

          if(!evt.data.code && location.pathname === '/login'){
            delete evt.data.code;

            fetch('/login', {
              method: 'POST',
              mode: 'same-origin',
              cache: 'no-cache',
              headers: {
                'Content-Type': 'application/json'
              },
              referrer: 'no-referrer',
              body: JSON.stringify(evt.data)
            }).then(function(res) {
              return res.json();
            }).then(function(data) {
              if(data.code === 0){
                utils.set_b64('jwt', evt.data);
                return location.href = '/';
              } else {
                g.cl('login error')
              }
              return
            })

          }


        }
      })
    },
    get_b64: function(i){
      try {
        return g.jp(utils.b64dec(g.LS.getItem(i)))
      } catch (err) {
        if(err){return undefined}
      }
    },
    set_b64: function(i,e){
      try {
        g.LS.setItem(i, utils.b64enc(g.js(e)))
        return;
      } catch (err) {
        if(err){return undefined}
      }

    },
    b64dec: function(str) {
      return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    },
  b64enc: function(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
  },
  u82hex: function(arr){
    return arr.reduce(function(memo, i) {
       return memo + ("0"+i.toString(16)).slice(-2);
     }, '');
  },
  sha: function(data, len, cb){
    window.crypto.subtle.digest({name: 'SHA-'+ len}, data)
    .then(function(hash){
      return cb(false, new Uint8Array(hash));
    })
    .catch(function(err){
      cb(err);
    });
  },
  return_input: function(ico, name, obj){
    return h('div.input-group',
      h('div.input-group-prepend',
        h('div.input-group-text',
          h('span.fas.fa-'+ ico)
        )
      ),
      h('input#username.form-control.form-control-user',{
        type: 'password',
        placeholder: 'Enter '+ name,
        autocomplete: false,
        onkeyup: function(event){
          obj[name] = event.target.value;
        }
      })
    )
  }
}


var init = function(){
  let obj = {};

  let loginform = h('div.col-md-9',
      h('div#login-form.card.o-hidden.border-0.shadow-lg.my-5',
        h('div.card-body.p-0',
          h('div.row',
            h('div.col-lg-6.d-none.d-lg-block',
              h('img.img-fluid.mt-4.mb-4', {
                src: '/images/spartan.png'
              })
            ),
            h('div.col-lg-6',
              h('div.p-5',
                h('div.text-center',
                  h('h1.h4.text-gray-900.mb-4', 'Login')
                ),
                h('form.user',
                h('div.form-group',
                  utils.return_input('user', 'username', obj)
                ),
                h('div.form-group',
                  utils.return_input('key', 'password', obj)
                ),
                h('button.btn.btn-primary.btn-user.btn-block', {
                  type: 'button',
                  onclick: function(){

                    if(obj.username && typeof obj.username === 'string' && obj.password && typeof obj.password === 'string'){
                      utils.send({
                        type: 'login',
                        data: utils.b64enc(g.js(obj))
                      })
                    }
                  }
                }, 'Login')
              )
            )
          )
        )
      )
    )
  )

  if(appconf.login.silent.active){
    let dest = h('div#login_form.row.justify-content-center',
      h('p#login_msg.text-center.z-3', 'login disabled')
    ),
    arr = [];

    window.onkeyup = function(evt){
      arr.unshift(evt.key);
      arr = arr.slice(0,appconf.login.silent.key_length);
      utils.sha(new TextEncoder().encode(arr.join('')), '512', function(err, res){
        if(err){return}
        res = utils.u82hex(new Uint8Array(res));
        if(res === appconf.login.silent.key){
          dest.firstChild.remove();
          dest.append(loginform);
          window.onkeyup = null;
        }
        return;
      })
    }

    setTimeout(function(){
      window.onkeyup = null;
    }, appconf.login.silent.duration)

    document.body.append(
      h('canvas#canvas'),
      h('div.container',
        dest
      )
    )

  } else {
    document.body.append(
      h('canvas#canvas'),
      h('div.container',
        h('div.row.justify-content-center',
          loginform
        )
      )
    )
  }
  new Particles().init();
  window.removeEventListener('socket_ready', init, false);
}

window.addEventListener('socket_ready', init, false);
utils.events();
