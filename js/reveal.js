export function initReveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('show'); io.unobserve(en.target); } });
  },{ threshold:.15 });
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}
