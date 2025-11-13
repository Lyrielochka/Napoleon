export function initTyping(){
  const el = document.getElementById('typeTarget');
  if(!el) return;
  const text = "\u0411\u0435\u043b\u0430\u0440\u0443\u0441\u044c \u0432 \u044d\u043f\u043e\u0445\u0443\n\u041d\u0430\u043f\u043e\u043b\u0435\u043e\u043d\u0430";
  el.textContent = text;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){
    el.classList.add('is-revealed');
    return;
  }
  el.classList.remove('is-revealed');
  requestAnimationFrame(()=>{
    setTimeout(()=>el.classList.add('is-revealed'), 160);
  });
}
