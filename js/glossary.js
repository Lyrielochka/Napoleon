import { tryLoadJSON } from './data.js';

export async function initGlossary({url='data/glossary.json', fallbackData=null}={}){
  let GLOSS = {};

  function toKey(s){
    return (s || '').trim().toLowerCase();
  }

  function buildTerms(){
    document.querySelectorAll('.gloss').forEach(node=>{
      const raw = node.textContent.trim();
      const key = toKey(raw);
      const hit = GLOSS[key];
      const btn = document.createElement('button');
      btn.className = 'term';
      btn.type = 'button';
      btn.textContent = hit?.term || raw;
      btn.dataset.term = hit?.term || raw;
      btn.dataset.def  = hit?.def  || 'Нет описания.';
      node.replaceWith(btn);
    });
  }

  const data = await tryLoadJSON(url, fallbackData);
  if(data) GLOSS = data;
  buildTerms();
  initGlossaryPopover();

  function initGlossaryPopover(){
    const pop = document.createElement('div');
    pop.className = 'g-popover';
    pop.setAttribute('role','dialog');
    pop.setAttribute('aria-modal','false');
    pop.style.display = 'none';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label','Закрыть определение');

    const title = document.createElement('h5');
    const text = document.createElement('p');
    pop.append(closeBtn, title, text);

    const arrow = document.createElement('div');
    arrow.className = 'g-arrow';
    arrow.style.display='none';

    document.body.append(pop, arrow);
    let currentTrigger = null;

    function positionPopover(trigger){
      const rect = trigger.getBoundingClientRect();
      const gap = 10;
      const topPref = rect.top + window.scrollY - pop.offsetHeight - gap;
      const bottomAlt = rect.bottom + window.scrollY + gap;
      const centerX = rect.left + rect.width/2 + window.scrollX;
      const left = Math.max(8, Math.min(centerX - pop.offsetWidth/2, document.documentElement.scrollWidth - pop.offsetWidth - 8));
      let top = topPref;
      let arrowTop = topPref + pop.offsetHeight - 6;
      let arrowLeft = Math.max(rect.left + rect.width/2 + window.scrollX - 6, left+12);
      let above = true;
      if(topPref < window.scrollY + 8){
        top = bottomAlt;
        arrowTop = top - 6;
        above = false;
      }
      pop.style.left = left+'px';
      pop.style.top = top+'px';
      arrow.style.left = (Math.min(Math.max(arrowLeft, left+12), left+pop.offsetWidth-24))+'px';
      arrow.style.top = arrowTop+'px';
      arrow.style.transform = above ? 'rotate(45deg)' : 'rotate(225deg)';
    }

    function open(trigger){
      currentTrigger = trigger;
      title.textContent = trigger.dataset.term || 'Неизвестно';
      text.textContent = trigger.dataset.def || '';
      pop.style.display = 'block';
      pop.style.opacity='0';
      arrow.style.display='block';
      requestAnimationFrame(()=>{
        positionPopover(trigger);
        pop.style.opacity='1';
      });
      trigger.setAttribute('aria-expanded','true');
    }

    function close(){
      if(!currentTrigger) return;
      currentTrigger.setAttribute('aria-expanded','false');
      pop.style.display = 'none';
      arrow.style.display='none';
      currentTrigger = null;
    }

    document.addEventListener('click', (e)=>{
      const t = e.target.closest('.term');
      if(t){
        e.stopPropagation();
        if(currentTrigger === t){
          close();
        }else{
          open(t);
        }
        return;
      }
      if(currentTrigger && !pop.contains(e.target)){
        close();
      }
    });

    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape') close();
      if((e.key==='Enter'||e.key===' ') && document.activeElement?.classList.contains('term')){
        e.preventDefault();
        document.activeElement.click();
      }
    });

    window.addEventListener('resize', ()=>{
      if(currentTrigger) positionPopover(currentTrigger);
    });
    window.addEventListener('scroll', ()=>{
      if(currentTrigger) positionPopover(currentTrigger);
    }, {passive:true});

    closeBtn.addEventListener('click', close);
  }
}
