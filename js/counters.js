export function initCounters(){
  const counters = document.querySelectorAll('.counter');
  const io2 = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target;
      const target = +el.dataset.target || 0;
      const dur = 1800;
      const start = performance.now();
      const step = (t)=>{
        const p = Math.min(1, (t - start)/dur);
        const val = Math.floor(target * (0.2 + 0.8*p*p));
        el.textContent = val.toLocaleString('ru-RU');
        if(p<1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io2.unobserve(el);
    });
  },{threshold:.6});
  counters.forEach(c=>io2.observe(c));
}
