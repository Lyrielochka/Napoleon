export const Toast = (()=>{
  const el = document.getElementById('toast');
  let hideT = null;
  return {
    show(msg, ms=1600){
      if(!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(hideT);
      hideT = setTimeout(()=>el.classList.remove('show'), ms);
    }
  };
})();
