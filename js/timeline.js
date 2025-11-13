import { Toast } from './toast.js';

export function initTimeline(){
  const tl = document.querySelector('.timeline');
  const tlTrack = document.getElementById('tlTrack');
  const tlPrev = document.getElementById('tlPrev');
  const tlNext = document.getElementById('tlNext');
  if(!tl || !tlTrack) return;

  function scrollByCards(dir){
    const first = tlTrack?.firstElementChild;
    const styleGap = parseFloat(getComputedStyle(tlTrack).columnGap || getComputedStyle(tlTrack).gap || 24);
    const cardWidth = first ? first.getBoundingClientRect().width : (window.innerWidth * 0.8);
    tl.scrollBy({ left: dir * (cardWidth + styleGap), behavior: 'smooth' });
  }

  tlPrev?.addEventListener('click', ()=>scrollByCards(-1));
  tlNext?.addEventListener('click', ()=>scrollByCards(1));

  function scrollTimelineTo(id, highlight = true){
    const card = document.getElementById(id);
    if(!card) return;
    const left = card.offsetLeft - (tl.clientWidth * 0.1);
    tl.scrollTo({ left, behavior: 'smooth' });
    if(highlight){
      card.classList.add('highlight');
      window.setTimeout(()=>card.classList.remove('highlight'), 2400);
    }
    document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleHash(){
    const hash = (location.hash || '').replace('#','');
    if(hash && document.getElementById(hash)){
      scrollTimelineTo(hash, true);
    }
  }

  window.addEventListener('hashchange', handleHash);
  if(location.hash){
    setTimeout(handleHash, 60);
  }

  document.addEventListener('click', async (e)=>{
    const a = e.target.closest('.permalink');
    if(!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').replace('#','');
    history.pushState(null, '', '#'+id);
    scrollTimelineTo(id, true);
    const url = new URL('#'+id, window.location.href).toString();
    try{
      await navigator.clipboard.writeText(url);
      Toast.show('Ссылка скопирована');
    }catch(err){
      const inp = document.createElement('input');
      inp.value = url;
      document.body.appendChild(inp);
      inp.select();
      try{
        document.execCommand('copy');
        Toast.show('Ссылка скопирована');
      }catch{
        Toast.show('Не удалось скопировать');
      }finally{
        document.body.removeChild(inp);
      }
    }
  });
}
