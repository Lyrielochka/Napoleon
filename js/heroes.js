import { tryLoadJSON } from './data.js';

export async function initHeroes({url='data/heroes.json', fallbackData=null}={}){
  let HEROES = new Map();

  function setHeroesMap(json){
    HEROES.clear();
    if(!json) return;
    const arr = Array.isArray(json) ? json : json.heroes;
    (arr || []).forEach(h=>{
      if(h && h.id){
        HEROES.set(String(h.id), h);
      }
    });
  }

  const data = await tryLoadJSON(url, fallbackData);
  setHeroesMap(data);

  const dlg = document.getElementById('heroModal');
  if(!dlg) return;
  const img = document.getElementById('heroImg');
  const meta = document.getElementById('heroMeta');
  const bio = document.getElementById('heroBio');
  const title = document.getElementById('heroTitle');
  const closeBtn = document.getElementById('heroClose');

  function openFromData(h){
    const name = h.name || 'Неизвестно';
    title.textContent = name;
    img.src = h.img || '';
    img.alt = 'Портрет: ' + name;
    meta.textContent = h.meta || '';
    bio.textContent = h.bio || '';
    if(typeof dlg.showModal === 'function'){
      dlg.showModal();
    }else{
      dlg.setAttribute('open','open');
      document.body.style.overflow='hidden';
    }
    closeBtn.focus();
  }

  function close(){
    if(typeof dlg.close === 'function'){
      dlg.close();
    }else{
      dlg.removeAttribute('open');
      document.body.style.overflow='';
    }
  }

  closeBtn.addEventListener('click', close);
  dlg.addEventListener('cancel', (e)=>{
    e.preventDefault();
    close();
  });
  dlg.addEventListener('click', (e)=>{
    const rect = dlg.querySelector('.modal-body').getBoundingClientRect();
    const head = dlg.querySelector('.modal-head').getBoundingClientRect();
    if(e.clientY < head.top || e.clientY > rect.bottom || e.clientX < Math.min(head.left, rect.left) || e.clientX > Math.max(head.right, rect.right)){
      close();
    }
  });

  document.addEventListener('click', (e)=>{
    const card = e.target.closest('.card[role="button"][data-id]');
    if(!card) return;
    const id = String(card.dataset.id || '').trim();
    const hero = HEROES.get(id);
    if(hero){
      openFromData(hero);
    }else{
      openFromData({
        name: card.querySelector('.hero-name')?.textContent || 'Неизвестно',
        meta: card.querySelector('.hero-meta')?.textContent || '',
        bio: card.querySelector('.hero-desc')?.textContent || '',
        img: card.querySelector('img')?.getAttribute('src') || ''
      });
    }
  });

  document.addEventListener('keydown', (e)=>{
    if((e.key==='Enter' || e.key===' ') && document.activeElement?.matches('.card[role="button"]')){
      e.preventDefault();
      document.activeElement.click();
    }
  });
}
