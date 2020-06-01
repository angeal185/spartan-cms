import { global as g } from  "/modules/global.mjs";
import { utils } from  "/modules/utils.mjs";
import { ws } from  "/modules/ws.mjs";

function init(){
  if(location.pathname !== '/login'){
    utils.init_admin()
  }
  ws.events();
}

if (document.readyState === "complete" ||(document.readyState !== "loading" && !document.documentElement.doScroll)){
  init()
} else {
  document.addEventListener("DOMContentLoaded", init());
}
