
function rest_dir(){
  let rest_url = process.cwd().split('/').slice(0,-1);
  rest_url.push('spartan-rest');
  return rest_url.join('/');
}

global.rest_dir = rest_dir();
global.base_dir = process.cwd();

global.cl = console.log;
global.ce = console.error;
global.jp = JSON.parse;
global.js = JSON.stringify;
