export function initTyping(){
  const el = document.getElementById('typeTarget');
  if(!el) return;
  const text = "\u041f\u043b\u0430\u043c\u044f 1812-\u0433\u043e";
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
