const MOBILE_BREAKPOINT = 760;

export function initNav(){
  const nav = document.querySelector('.nav');
  if(!nav) return;

  const toggle = nav.querySelector('.nav__toggle');
  const linksContainer = nav.querySelector('.nav__links');
  if(!toggle || !linksContainer) return;

  const links = Array.from(linksContainer.querySelectorAll('a[href^="#"]'));

  const closeMenu = ({ focusToggle = false } = {}) => {
    if(!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if(focusToggle) toggle.focus();
  };

  const openMenu = () => {
    if(nav.classList.contains('is-open')) return;
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  };

  const handleToggle = () => {
    if(nav.classList.contains('is-open')){
      closeMenu();
    }else{
      openMenu();
    }
  };

  toggle.addEventListener('click', handleToggle);

  links.forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('keydown', event => {
    if(event.key === 'Escape'){
      closeMenu({ focusToggle: true });
    }
  });

  document.addEventListener('click', event => {
    if(!nav.classList.contains('is-open')) return;
    if(nav.contains(event.target)) return;
    closeMenu();
  });

  window.addEventListener('resize', () => {
    if(window.innerWidth > MOBILE_BREAKPOINT){
      closeMenu();
    }
  }, { passive: true });

  nav.addEventListener('focusout', event => {
    if(!nav.contains(event.relatedTarget)){
      closeMenu();
    }
  });
}
