export function initParallax(){
  const el = document.getElementById('silhouettes');
  if(!el) return; const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if(reduce) return;
  let ticking = false;
  function onScroll(){ if(ticking) return; ticking = true; requestAnimationFrame(()=>{ const y = window.scrollY || document.documentElement.scrollTop || 0; el.style.transform = 	ranslate3d(0, px, 0); ticking = false; }); }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
}
