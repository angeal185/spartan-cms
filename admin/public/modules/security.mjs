import { global as g } from  "/modules/global.mjs";
import { enc } from '/modules/enc.mjs';
import { ws } from  "/modules/ws.mjs";
import { h } from  "/modules/h.mjs";
import { utils } from  "/modules/utils.mjs";
import { ls,ss } from  "/modules/storage.mjs";

var init = function(){

  let row_ssl_cert = h('div.row'),
  row_rsa_oaep = row_ssl_cert.cloneNode(true),
  sec_arr = ['admin', 'rest'],
  rsa_oaep_arr = ['contact', 'subscribe'];


  let row_user = h('div.row',
    h('div.col-6',
      h('div.form-group',
        h('label', 'update username'),
        h('input#user_current_username.form-control', {
          type: 'text',
          placeholder: 'enter current username'
        })
      ),
      h('div.form-group',
        h('input#user_new_username.form-control', {
          type: 'text',
          placeholder: 'enter new username'
        })
      ),
      h('button.btn.btn-outline-secondary.mt-2.mb-2.float-right', {
        type: 'button',
        onclick: function(){

          let user = document.getElementById('user_current_username').value,
          newuser = document.getElementById('user_new_username').value;

          if(user === '' || newuser === ''){
            return utils.toast('danger', 'username cannot be empty');
          }

          utils.confirm('update current username?', function(res){
            if(res){
              return ws.send({
                type: 'user_username_update',
                data: {
                  current: user,
                  username: newuser
                }
              })
            }
          })
        }
      }, 'update')
    ),
    h('div.col-6',
      h('div.form-group',
        h('label', 'update password'),
        h('div.input-group',
          h('input#user_current_password.form-control', {
            type: 'password',
            placeholder: 'enter current password'
          }),
          h('div.input-group-append',
          h('div.input-group-text.far.fa-eye',{
            onclick: function(){
              let dest = this.parentNode.previousSibling;
              if(dest.type === 'text'){
                return dest.type = 'password';
              }
              dest.type = 'text';
            }
          })
          )
        )
      ),
      h('div.form-group',
        h('div.input-group',
          h('input#user_new_password.form-control', {
            type: 'password',
            placeholder: 'enter new password'
          }),
          h('div.input-group-append',
          h('div.input-group-text.far.fa-eye',{
            onclick: function(){
              let dest = this.parentNode.previousSibling;
              if(dest.type === 'text'){
                return dest.type = 'password';
              }
              dest.type = 'text';
            }
          })
          )
        )
      ),
      h('button.btn.btn-outline-secondary.mt-2.mb-2.float-right', {
        type: 'button',
        onclick: function(){

          let pass = document.getElementById('user_current_password').value,
          newpass = document.getElementById('user_new_password').value;

          if(pass === '' || newpass === ''){
            return utils.toast('danger', 'password cannot be empty');
          }

          utils.confirm('update current password?', function(res){
            if(res){
              return ws.send({
                type: 'user_password_update',
                data: {
                  current: pass,
                  password: newpass
                }
              })
            }
          })
        }
      }, 'update'),
    )
  )

  let row_access_token = h('div.row',
    h('div.col-6',
      h('div.form-group',
        h('label', 'Active'),
        h('div.input-group',
          h('input#access_token_status.form-control', {
            type: 'text',
            readOnly: true,
            value: appconf.settings.spartan_token.active
          }),
          h('div.input-group-append',
            h('div.input-group-text.cp',{
              onclick: function(){
                let dest = this.parentNode.previousSibling;
                if(dest.value === 'true'){
                  return dest.value = 'false';
                }
                dest.value = 'true';
              }
            }, 'toggle')
          )
        )
      ),
      h('div.form-group',
        h('label.w-100', 'current token',
          h('span.far.fa-eye.float-right.cp.lh-15', {
            onclick: function(evt){
              evt.target.parentNode.parentNode.childNodes[1].classList.toggle('sec-text');
            }
          })
        ),
        h('input#access_token_current.form-control.sec-text', {
          type: 'text',
          value: appconf.settings.spartan_token.token,
          readOnly: true
        })
      ),
      h('div.form-group',
        h('label.w-100', 'new token',
          h('span.far.fa-eye.float-right.cp.lh-15', {
            onclick: function(evt){
              evt.target.parentNode.parentNode.childNodes[1].classList.toggle('sec-text');
            }
          })
        ),
        h('input#access_new_token.form-control', {
          type: 'text',
          readOnly: true
        })
      )
    ),
    h('div.col-6',
      h('div.form-group',
        h('label', 'token length'),
        h('input#access_token_length.form-control', {
          type: 'number',
          value: appconf.settings.spartan_token.len,
          min: 32,
          max: 2048,
          step: 32,
          onchange: function(){
            var array = new Uint32Array(parseInt(this.value));
            document.getElementById('access_new_token').value = enc.u82hex(window.crypto.getRandomValues(array));
          }
        })
      ),
      h('div.form-group',
        h('label', 'generate token'),
        h('div.hov-div', {
          onmousemove: function(){
            let hashlen = parseInt(document.getElementById('access_token_length').value),
            array = new Uint32Array(hashlen);
            document.getElementById('access_new_token').value = enc.u82hex(window.crypto.getRandomValues(array));
          }
        },'hover'),
        h('button.btn.btn-outline-secondary.mt-2.mb-2.float-right', {
          type: 'button',
          onclick: function(){
            let current = document.getElementById('access_token_current')
            let obj = {
              active: g.jp(document.getElementById('access_token_status').value),
              token: document.getElementById('access_new_token').value,
              len: parseInt(document.getElementById('access_token_length').value),
              current: current.value
            }

            for (let val in obj) {
              if(obj[val] === '' || obj[val] === NaN){
                return utils.toast('danger', 'error in access token data')
              }
            }

            utils.confirm('update current access token?', function(res){
              if(res){
                fetch('/access_token', {
                  method: 'POST',
                  mode: 'same-origin',
                  cache: 'no-cache',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  referrer: 'no-referrer',
                  body: JSON.stringify(obj)
                }).then(function(res) {
                  return res.json();
                }).then(function(data) {
                  if(data.code === 1){
                    return utils.toast('danger', data.msg)
                  }
                  current.value = obj.token;
                  return utils.toast('success', data.msg)
                })

              }
            })
          }
        }, 'update')
      )
    )
  )

  for (let i = 0; i < sec_arr.length; i++) {
    row_ssl_cert.append(
      h('div.col-6',
        h('div.form-group',
          h('label.w-100', sec_arr[i] +' cert',
            h('span.far.fa-eye.float-right.cp.lh-15', {
              onclick: function(evt){
                evt.target.parentNode.parentNode.childNodes[1].classList.toggle('sec-text')
              }
            })
          ),
          h('textarea.form-control.sec-text', {
            value: appconf.ssl[sec_arr[i]].cert,
            rows: 10,
            readOnly: true
          }),
          h('input.form-control.mt-2', {
            type: 'text',
            readOnly: true,
            value: appconf.openssl[sec_arr[i]].cert.file
          })
        )
      ),
      h('div.col-6',
        h('div.form-group',
          h('label.w-100', sec_arr[i] +' key',
            h('span.far.fa-eye.float-right.cp.lh-15', {
              onclick: function(evt){
                evt.target.parentNode.parentNode.childNodes[1].classList.toggle('sec-text')
              }
            })
          ),
          h('textarea.form-control.sec-text', {
            value: appconf.ssl[sec_arr[i]].key,
            rows: 10,
            readOnly: true
          }),
          h('input.form-control.mt-2', {
            type: 'text',
            readOnly: true,
            value: appconf.openssl[sec_arr[i]].key.file
          }),
          h('button.btn.btn-outline-secondary.mt-2.mb-2.mr-2.float-right', {
            type: 'button',
            onclick: function(){
              utils.confirm('create new ssl cert?', function(res){
                if(res){
                  return ws.send({
                    type: 'ssl_cert_gen',
                    obj: {
                      dest: sec_arr[i],
                      key: appconf.openssl[sec_arr[i]].key.file,
                      cert: appconf.openssl[sec_arr[i]].cert.file
                    }
                  })
                }
              })
            }
          }, 'create new')
        )
      )
    )
  }

  for (let i = 0; i < rsa_oaep_arr.length; i++) {
    row_rsa_oaep.append(
      h('div.col-6',
        h('div.form-group',
          h('label.w-100', rsa_oaep_arr[i] +' cert',
            h('span.far.fa-eye.float-right.cp.lh-15', {
              onclick: function(evt){
                evt.target.parentNode.parentNode.childNodes[1].classList.toggle('sec-text')
              }
            })
          ),
          h('textarea.form-control.sec-text', {
            value: JSON.stringify(appconf.settings.RSA_OAEP[rsa_oaep_arr[i]]),
            rows: 10,
            readOnly: true
          }),
          h('div.row',
            h('div.col-6',
              h('div.form-group.mt-4',
                h('label', 'key length'),
                h('input.form-control.mt-2', {
                  type: 'text',
                  readOnly: true,
                  value: appconf.settings.RSA_OAEP_config.key_length
                })
              )
            ),
            h('div.col-6',
              h('div.form-group.mt-4',
                h('label', 'hash'),
                h('input.form-control.mt-2', {
                  type: 'text',
                  readOnly: true,
                  value: 'SHA-'+ appconf.settings.RSA_OAEP_config.sha
                })
              )
            )
          ),
          h('button.btn.btn-outline-secondary.mt-2.mb-2.mr-2.float-right', {
            type: 'button',
            onclick: function(evt){
              let rdest = evt.target.parentNode.childNodes[1];
              utils.confirm('Create new '+ rsa_oaep_arr[i] +' RSA-OAEP keypair?', function(res){
                if(res){
                  utils.toast('info', 'Generating '+ rsa_oaep_arr[i] +' RSA-OAEP keypair...')
                  let cnf = {
                    len: appconf.settings.RSA_OAEP_config.key_length,
                    sha: appconf.settings.RSA_OAEP_config.sha
                  }
                  enc.rsa_oaep_keygen(cnf, function(err, res){
                    if(err){return utils.toast('danger', 'RSA-OAEP '+ rsa_oaep_arr[i] +' keygen failed')}
                    utils.toast('success', 'RSA-OAEP keygen '+ rsa_oaep_arr[i] +' success, saving...')
                    rdest.value = JSON.stringify(res.private);
                    ws.send({
                      type: 'rsa_oaep_gen',
                      dest: rsa_oaep_arr[i],
                      keypair: res
                    })
                    rdest = null;
                  })

                }
              })
            }
          }, 'create new')
        )
      )
    )
    // body...
  }


  document.getElementById('main-content').append(
    h('h3', 'Security'),
    h('h5', 'User data'),
    row_user,
    h('hr.w100'),
    h('h5', 'Access token'),
    row_access_token,
    h('hr.w100'),
    h('h5', 'SSL cert',
      h('small.float-right', appconf.openssl.admin.type)
    ),
    row_ssl_cert,
    h('hr.w100'),
    h('h5', 'RSA OAEP'),
    row_rsa_oaep
  );


  window.addEventListener('safe_unlock', function(evt) {
    evt = evt.detail;

  })


/*
    utils.confirm('update selected safe?', function(res){
      if(res){
        return ws.send({
          type: 'safe_update',
          data: {
            data: data,
            password: password,
            type: type
          }
        })
      }
    })
*/

  window.removeEventListener('socket_ready', init, false);
}



window.addEventListener('socket_ready', init, false)
