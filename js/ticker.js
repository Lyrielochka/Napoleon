export function initTicker(){
  const track = document.getElementById('tickerTrack');
  if(!track) return; const content = track.innerHTML; track.innerHTML = content + content;
}
