export function initAnchorScroll(){
  document.querySelectorAll('.nav a, .down').forEach(a=>{
    a.addEventListener('click', e=>{
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        e.preventDefault();
        document.querySelector(href).scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null, '', href);
      }
    });
  });
}
