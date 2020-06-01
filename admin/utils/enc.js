const crypto = require('crypto'),
sec_cnf = require('../config/sec_cnf'),
db = require('./db'),
fs = require('fs-extra'),
rest_cnf = require(rest_dir + '/app/config/index.json');

const enc = {
  rand: function(i){
    return crypto.randomBytes(i);
  },
  scrypt: function(secret, salt, cb){
    crypto.scrypt(secret, salt, sec_cnf.user.keylen, sec_cnf.user.scrypt, function(err, res){
      if (err) throw err;
      cb(false, res);
    });
  },
  pbkdf2: function(secret, salt, cb){
    crypto.pbkdf2(
      secret, salt, sec_cnf.user.pbkdf2.iterations, sec_cnf.user.keylen, sec_cnf.user.pbkdf2.sha, function(err, res){
        if (err) throw err;
        cb(false, res);
      }
    );
  },
  gen_password: function(obj, cb){
    let salt = enc.rand(64).toString('hex');
    obj.salt = [salt.slice(0, 64), salt.slice(64)]

    enc.pbkdf2(obj.password, Buffer.from(obj.salt[0]), function(err,res){
      if(err){return cb(err)};
      enc.scrypt(res, Buffer.from(obj.salt[1]), function(err,res){
        if(err){return cb(err)};
        obj.password = res.toString('hex');
        obj = enc.jwt_gen(obj);
        cl(obj)
        db.set_user(obj, function(err, res){
          if(err){return cb(err)};
          delete obj.password;
          delete obj.salt;
          delete obj.active;
          obj.msg = 'userdata update success';
          cb(false, obj)
        })
      })
    })

  },
  update_user: function(obj, cb){
    db.get_user(function(err, userData){
      if(err){return cb(err)}
      if(obj.current !== userData.user){
        return cb('username does not match')
      }
      userData.user = obj.user;
      db.set_user(userData, function(err){
        if(err){return cb(err)};
        return cb(false)
      })
    })
  },
  update_password: function(obj, cb){

    db.get_user(function(err, userData){
      if(err){return cb(err)}
      let arr = userData.salt;
      enc.pbkdf2(obj.current, Buffer.from(arr[0]), function(err,res){
        if(err){return cb(err)};
        enc.scrypt(res, Buffer.from(arr[1]), function(err,res){
          if(err){return cb(err)};
          obj.current = res.toString('hex');

          if(userData.password !== obj.current){
            return cb('incorrect login details')
          }

          delete obj.current;
          obj.user = userData.user;

          enc.gen_password(obj, function(err,res){
            if(err){return cb(err)}
            return cb(false, res)
          })

        })
      })
    })
  },
  verify_password: function(obj, cb){

    db.get_user(function(err, userData){
      if(err){return cb(err)}
      enc.pbkdf2(obj.password, Buffer.from(userData.salt[0]), function(err,res){
        if(err){return cb(err)};
        enc.scrypt(res, Buffer.from(userData.salt[1]), function(err,res){
          if(err){return cb(err)};
          obj.password = res.toString('hex');

          let last_login = userData.expires;

          if(userData.password !== obj.password || userData.user !== obj.user){
          return db.attempts_add(obj.ip, function(err){
              if(err){return cb(err)};
              return cb(false, {code: 1, msg: 'incorrect login details'})
            })
          }

          obj.salt = userData.salt;
          obj = enc.jwt_gen(obj);
          db.set_user(obj, function(err){
            if(err){return cb(err)};
            delete obj.password;
            delete obj.ip;
            delete obj.salt;
            obj.code = 0;
            obj.msg = 'login success';
            db.put('last_login', last_login, function(err){
              if(err){return cb(err)};
              db.count_add('total_login', 1, function(err){
                if(err){return cb(err)};
                cb(false, obj)
              })
            })
          })
        })
      })
    })

  },
  jwt_gen: function(obj){
    obj.expires = Date.now() + sec_cnf.user.duration;
    obj.token = enc.rand(32).toString('hex');
    obj.sig = enc.rand(32).toString('hex');
    obj.active = true;
    return obj;
  },
  jwt_reset: function(obj){
    obj.expires = Date.now();
    obj.token = enc.rand(32).toString('hex');
    obj.sig = enc.rand(32).toString('hex');
    obj.active = true;
    return obj;
  },
  jwt_check: function(obj, cb){
    db.get_user(function(err, res){
      if(err){return cb(err)};

      if(res.active === false){
        return cb(false, {code: 1, msg: 'account blocked'})
      }

      if(res.expires < Date.now() || obj.expires < Date.now()){
        return cb(false, {code: 1, msg: 'login expired'})
      }

      if(res.token !== obj.token){
        return cb(false, {code: 1, msg: 'incorrect login details'})
      }
      cl('token valid')
      return cb(false, {code: 0, msg: 'login ok'})

    })
  },
  sig_check: function(item, cb){
    db.get_user(function(err, res){
      if(err){return cb(err)};
      if(res.expires < Date.now()){
        return cb(false, {code: 1})
      }

      if(enc.hmac(res.sig, res.token) !== item){
        return cb(false, {code: 1})
      }
      return cb(false, {code: 0})
    })
  },
  b64_dec: function(i){
    return Buffer.from(i, 'base64').toString('binary');
  },
  b64_enc: function(i){
    return Buffer.from(i, 'binary').toString('base64');
  },
  hmac: function(secret, data){
    try {
      const sig = crypto.createHmac('sha3-512', secret);
      sig.update(data);
      return sig.digest('hex');
    } catch (err) {
      throw new ERROR('hmac tamper');
    }
  },
  sha3: function(hash, data){
    const sig = crypto.createHash('sha3-'+ hash);
    sig.update(data);
    return sig.digest('base64');
  },
  encrypt: function (text, key, cb){
    try {
      key = Buffer.from(key, 'hex');
      const iv = crypto.randomBytes(32),
      cipher = crypto.createCipheriv(sec_cnf.encryption.cipher.mode, key, iv),
      encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      return cb(false, Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(sec_cnf.encryption.cipher.encode));
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  decrypt: function (encdata, key, cb){
    try {
      key = Buffer.from(key, 'hex');
      encdata = Buffer.from(encdata, sec_cnf.encryption.cipher.encode);
      const decipher = crypto.createDecipheriv(sec_cnf.encryption.cipher.mode, key, encdata.slice(0, 32));
      decipher.setAuthTag(encdata.slice(32,48));
      return cb(false, decipher.update(encdata.slice(48), 'binary', 'utf8') + decipher.final('utf8'));
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  lock_safe: function(secret, data, dest, cb){
    let salt = enc.rand(32),
    sig = enc.rand(32),
    obj = {
      salt: Buffer.from(salt).toString('hex'),
      secret: enc.rand(32).toString('hex')
    },
    obj2 = {};

    enc.pbkdf2(secret, salt, function(err, secret){
      if(err){return cb(err)}
      enc.encrypt(data, secret, function(err, res){
        if(err){return cb(err)}
        obj2.sig = enc.hmac(Buffer.from(obj.secret, 'hex'), res)
        obj2.data = res;
        fs.readFile(sec_cnf.keyfile, 'utf8', function(err, res){
          if(err){return cb(err)}
          res = jp(res);
          res[dest] = obj;
          fs.writeFile(sec_cnf.keyfile, js(res), function(err){
            if(err){return cb(err)}
            fs.writeFile('./admin/safe/'+ dest, js(obj2), function(err){
              if(err){return cb(err)}
              cb(false)
            })
          })
        })
      })
    })
  },
  unlock_safe: function(secret, dest, cb){

    fs.readFile(sec_cnf.keyfile, 'utf8', function(err, obj){
      if(err){return cb(err)}
      obj = jp(obj)[dest];

      fs.readFile('./admin/safe/'+ dest, 'utf8', function(err, res){
        if(err){return cb(err)}
        res = jp(res);

        if(enc.hmac(Buffer.from(obj.secret, 'hex'), res.data) !== res.sig){
          return cb('data tamper detected')
        }
        enc.pbkdf2(secret, Buffer.from(obj.salt, 'hex'), function(err, secret){
          if(err){return cb(err)}
          enc.decrypt(res.data, secret, function(err, res){
            if(err){return cb(err)}
            cb(false, jp(res));
          })
        })
      })
    })
  },
  ecdsa_keygen: function(cb){
    try {
      const { generateKeyPairSync } = require('crypto');
      const { publicKey, privateKey } = generateKeyPairSync('ec', {
        namedCurve: 'secp521r1',
        publicKeyEncoding: {
          type: 'spki',
          format: 'der'
        },
        privateKeyEncoding: {
          type: 'sec1',
          format: 'der'
        }
      }),
      obj = {
        publicKey: publicKey.toString('hex'),
        privateKey: privateKey.toString('hex')
      }
      cb(false, obj)
    } catch (err) {
      cb(err)
    }
  },
  ecdsa_sign: function(data, privateKey, cb){
    try {
      const key = crypto.createPrivateKey({
        key: Buffer.from(privateKey, 'hex'),
        format: sec_cnf.ecdsa_config.private.format,
        type: sec_cnf.ecdsa_config.private.type
      }),
      sign = crypto.createSign(sec_cnf.ecdsa_config.sha);
      sign.update(data);
      sign.end();
      cb(false, sign.sign(key, 'hex'));
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  ecdsa_verify: function(data, publicKey, signature, cb){
    try {
      const key = crypto.createPublicKey({
        key: Buffer.from(publicKey, 'hex'),
        format: sec_cnf.ecdsa_config.public.format,
        type: sec_cnf.ecdsa_config.public.type
      }),
      verify = crypto.createVerify(sec_cnf.ecdsa_config.sha);
      verify.update(data);
      verify.end();
      cb(false, verify.verify(key, signature, 'hex'));
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  ecdsa_pair_gen: function(cb){
    enc.ecdsa_keygen(function(err, keypair){
      if(err){return cl(err)}
      enc.ecdsa_keygen(function(err, keypair2){
        if(err){return cl(err)}
        let c_path = rest_dir + '/app/config/cert.json',
        c_path2 = './admin/config/sec_cnf.json';

        fs.readJson(c_path, function(err, data){
          if(err){return cl(err)}
          fs.readJson(c_path2, function(err, data2){
            if(err){return cl(err)}

            data.ecdsa.admin.privateKey = keypair.privateKey;
            data.ecdsa.admin.publicKey = keypair2.publicKey;

            data2.ecdsa.rest.privateKey = keypair2.privateKey;
            data2.ecdsa.rest.publicKey = keypair.publicKey;

            fs.writeJson(c_path, data, function(err){
              if(err){return cl(err)}
                fs.writeJson(c_path2, data2, function(err){
                  if(err){return cl(err)}
                  cb(false, 'keypair generate success')
              })
            })
          })
        })
      })
    })
  },
  ecdh_keygen: function(cb){
    try {
      const gen = crypto.createECDH('secp521r1');
      const newKey = gen.generateKeys('hex', 'compressed');

      cb(false, gen.getPrivateKey('hex'), newKey)
    } catch (err) {
      if(err){return cb(err)}
    }
  },
  ecdh_compute: function(privateKey, publicKey, cb){
    try {
      const gen = crypto.createECDH('secp521r1');
      gen.setPrivateKey(Buffer.from(privateKey, 'hex'));
      const final = gen.computeSecret(Buffer.from(publicKey, 'hex'), 'compressed', 'hex');
      cb(false, final)
    } catch (err) {
      if(err){return cb(err)}
    }
  }
}

module.exports = enc;
