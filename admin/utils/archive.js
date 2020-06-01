const archiver = require('archiver'),
config = require('../config/gzip_cnf'),
fs = require('fs-extra');


const archive = {
  stream: function(obj, cb){
    var output = fs.createWriteStream(obj.dest + '.tgz');
    var archive = archiver('tar', {
      gzip: true,
      gzipOptions: config
    })

    output.on('close', function() {
      return cb(false, archive.pointer())
    });

    archive.on('error', function(err) {
      return cb('unable to create archive')
    });

    archive.append(obj.data, { name: obj.dest });

    archive.finalize();

    archive.pipe(output);
  },
  create: function(obj, cb){

    var output = fs.createWriteStream(obj.dest);
    var z_cnf = {
      zlib: config
    }

    if(obj.type === 'tar'){
      z_cnf = {
        gzip: true,
        gzipOptions: config
      }
    }
    var archive = archiver(obj.type, z_cnf)

    output.on('close', function() {
      console.log('ok')
      console.log(archive.pointer())
      return cb(false, archive.pointer())
    });

    archive.on('error', function(err) {
      return cb('unable to create archive')
    });


    archive.file(obj.src, {
      name: obj.name
    });
    archive.finalize();

    archive.pipe(output);

  }
}

/*
archive.create({src: './', name: 'admin.sh', dest: './test/admin2.sh.zip', type: 'zip'}, function(err){
  if(err){return console.log(err)}
})
*/
module.exports = archive;
