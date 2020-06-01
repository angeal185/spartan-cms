const tar = require('tar'),
gzcnf = require('../config/gzip_cnf'),
fs = require('fs');

const t = {
  backup: function(file, cb){
    let b_path = './store/backup/files';
    tar.u({
        file: b_path +'.tgz',
        gzip: gzcnf
      },
      [file]
    )
    .then(function(res){
      return cb(false, 'backup success');
    })
    .catch(function(err){
      console.log('backup not found, creating...')
      t.create({name: b_path, files: [file]}, function(err,res){
        if(err){return cb('backup create error')}
        return cb(false, res)
      })
    })
  },
  fileList: function(obj, cb){
    let arr = [];
    tar.t({
      file: obj.name +'.tgz',
      onentry: function(item){
        arr.push(item.header.path);
      }
    })
    .then(function(){
      cb(false, arr)
    })
    .catch(function(err){
      cb(err)
    })
  },
  create: function(obj, cb){

    tar.c({
        gzip: gzcnf,
        file: obj.name +'.tgz'
      },
      obj.files
    )
    .then(function(res){
      cb(false, 'success')
    })
    .catch(function(err){
      cb(err)
    })
  }
}

/* backup_list
t.fileList({name:'./store/backup/files'}, function(err,res){
  if(err){return console.log('tar list error')}
  return console.log(res)
})
*/
module.exports = t;
