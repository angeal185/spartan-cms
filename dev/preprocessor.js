require('../admin/utils/globals')

const config = require('./'),
fs = require('fs');

void function(){
  let pid_path = process.cwd().split('/').slice(0,-1);
  pid_path.push('.tmp/pid/css_monitor_pid');
  pid_path = pid_path.join('/');

  fs.writeFile(pid_path, JSON.stringify(process.pid), function(err){
    for (let key in config.css) {
      if(config.css[key]){
        require('./'+ key + '/').watch()
      }
    }
  })
}()
