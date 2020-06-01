
const enc = {
  b64enc: function(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
  },
  b64dec: function(str) {
    return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
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
  hex2u8: function(hex) {
      for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
      return new Uint8Array(bytes);
  },
  u82hex: function(arr){
    return arr.reduce(function(memo, i) {
       return memo + ("0"+i.toString(16)).slice(-2);
     }, '');
  },
  aes_gcm_keygen: function(cb){
    window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    )
    .then(function(key){
      window.crypto.subtle.exportKey("raw", key)
      .then(function(keydata){
        keydata = new Uint8Array(keydata);
        cb(false, keydata)
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });
  },
  aes_gcm_enc: function(key, data, cb){

    window.crypto.subtle.importKey(
        "raw",
        key,
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"]
    )
    .then(function(key){

      let obj = {
        iv: window.crypto.getRandomValues(new Uint8Array(12))
      }
      window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: obj.iv,
            tagLength: 128
          },
        key,
        new TextEncoder().encode(data)
      )
      .then(function(encrypted){
        obj.data = enc.u82hex(new Uint8Array(encrypted));
        cb(false, obj);
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });

  },
  aes_gcm_dec: function(obj, data, cb){

    window.crypto.subtle.importKey(
        "raw",
        enc.hex2u8(obj.key),
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"]
    )
    .then(function(key){

      window.crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: enc.hex2u8(obj.iv),
            tagLength: 128,
          },
          key,
          enc.hex2u8(data)
      )
      .then(function(decrypted){
        let ptext = new TextDecoder().decode(new Uint8Array(decrypted));
        cb(false, ptext);
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });

  },
  rsa_oaep_keygen: function(cnf, cb){
    window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: cnf.len,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {
          name: "SHA-"+ cnf.sha
        }
      },
      true,
      ["encrypt", "decrypt"]
    )
    .then(function(key){

      window.crypto.subtle.exportKey("jwk", key.publicKey)
      .then(function(pubkey){

        let obj = {
          public: pubkey
        }

        window.crypto.subtle.exportKey("jwk",key.privateKey)
        .then(function(prvkey){
            obj.private = prvkey;
            cb(false, obj)
        })
        .catch(function(err){
          cb(err);
        });
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });
  },
  rsa_oaep_enc: function(pubKey, obj, cb){

    if(!obj.u8){
      obj.data = new TextEncoder().encode(obj.data);
    }

    window.crypto.subtle.importKey(
      "jwk",
      pubKey,
      {
        name: "RSA-OAEP",
        hash: {
          name: "SHA-"+ obj.sha
        }
      },
      false,
      ["encrypt"]
    )
    .then(function(key){
      window.crypto.subtle.encrypt({name: "RSA-OAEP"}, key, obj.data)
      .then(function(encrypted){
         cb(false, new Uint8Array(encrypted));
      })
      .catch(function(err){
        cb(err);
      });
    })
    .catch(function(err){
      cb(err);
    });
  },
  rsa_oaep_dec: function(prvKey, obj, cb){
    window.crypto.subtle.importKey(
      "jwk",
      prvKey,
      {
        name: "RSA-OAEP",
        hash: {
          name: "SHA-"+ obj.sha
        }
      },
      false,
      ["decrypt"]
    )
    .then(function(key){

      window.crypto.subtle.decrypt({name: "RSA-OAEP"},key, obj.data)
      .then(function(decrypted){
        decrypted = new Uint8Array(decrypted);
        if(!obj.u8){
          decrypted = new TextDecoder().decode(decrypted);
        }
        cb(false, decrypted);
      })
      .catch(function(err){
        cb(err);
      });

    })
    .catch(function(err){
      cb(err);
    });
  },
  rsa_aes_enc: function(ptext, publicKey, sha, cb){
    enc.aes_gcm_keygen(function(err, key){
      if(err){return console.error(err)}
       let obj = {
         key: enc.u82hex(key)
       }
       enc.aes_gcm_enc(key, ptext, function(err, res){
         if(err){return console.error(err)}
         let final = {
           data: res.data
         }
         obj.iv = enc.u82hex(res.iv);

         enc.rsa_oaep_enc(publicKey, {data: JSON.stringify(obj), u8: false, sha: sha}, function(err, ctext){
          if(err){return console.error(err)}
           final.ctext = enc.u82hex(ctext);
           cb(false, final)
         })

       })

    })
  },
  rsa_aes_dec: function(obj, privateKey, sha, cb){
    enc.rsa_oaep_dec(privateKey, {data: enc.hex2u8(obj.ctext), u8: false, sha: sha}, function(err, res){
      if(err){return cb(err)}
      res = JSON.parse(res);

      enc.aes_gcm_dec(res, obj.data, function(err, ptext){
        if(err){return cb(err)}
        cb(false, ptext);
      })

    })
  }
}
/*
rsa_oaep_keygen(function(err, res){
  if(err){return console.error(err)}
  console.log(res)
})
*/
export { enc }
