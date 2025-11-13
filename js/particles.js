export function initParticles(){
  const wrap = document.getElementById('particles');
  if(!wrap) return;
  wrap.innerHTML = '';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  const layers = Math.min(16, Math.max(7, Math.round(window.innerWidth / 160)));
  for(let i = 0; i < layers; i++){
    const el = document.createElement('span');
    el.className = 'smoke';
    const left = (Math.random() * 100).toFixed(2);
    const delay = (Math.random() * -18).toFixed(2) + 's';
    const duration = (18 + Math.random() * 14).toFixed(2) + 's';
    const scaleStart = (0.6 + Math.random() * 0.6).toFixed(2);
    const scaleMid = (parseFloat(scaleStart) + 0.2).toFixed(2);
    const scaleEnd = (parseFloat(scaleMid) + 0.2).toFixed(2);
    const driftEndValue = (Math.random() * 24 - 12).toFixed(2);
    const driftMidValue = (driftEndValue / 2).toFixed(2);
    const width = (180 + Math.random() * 220).toFixed(0) + 'px';
    const height = (240 + Math.random() * 280).toFixed(0) + 'px';
    el.style.left = `${left}vw`;
    el.style.setProperty('--delay', delay);
    el.style.setProperty('--duration', duration);
    el.style.setProperty('--scale-start', scaleStart);
    el.style.setProperty('--scale-mid', scaleMid);
    el.style.setProperty('--scale-end', scaleEnd);
    el.style.setProperty('--drift-mid', `${driftMidValue}vw`);
    el.style.setProperty('--drift-end', `${driftEndValue}vw`);
    el.style.setProperty('--smoke-width', width);
    el.style.setProperty('--smoke-height', height);
    wrap.appendChild(el);
  }
}
