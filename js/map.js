const DEFAULT_DATA_URL = "map-data.json";
const YEAR_COLORS = {
  1812: "#c47a38",
  "1812-autumn": "#d29158",
  1813: "#a56b3e",
  1814: "#805233"
};

export function initMap(options = {}){
  const root = options.section || document.querySelector('#map');
  if (!root) return;

  const container = root.querySelector('.interactive-map') || root.querySelector('[data-map-stage]')?.closest('.map');
  const stage = container?.querySelector('[data-map-stage]');
  const canvas = stage?.querySelector('[data-map-canvas]');
  const tooltip = stage?.querySelector('[data-map-infobox]');
  const toolbar = container?.querySelector('[data-map-toolbar]');
  const hint = container?.querySelector('[data-map-hint]');
  const legend = stage?.querySelector('[data-map-legend]') || container?.querySelector('[data-map-legend]');
  const legendToggle = legend?.querySelector('[data-map-legend-toggle]');
  const legendPanel = legend?.querySelector('[data-map-legend-panel]');
  const legendList = legend?.querySelector('[data-map-legend-list]');
  const legendTitleEl = legend?.querySelector('[data-map-legend-title]');

  if (!container || !stage || !canvas || !tooltip){
    console.warn('[map] markup is incomplete');
    return;
  }

  function renderFrame(timestamp){
    if (canvas.isConnected === false){
      animationState = null;
      animationFrameId = null;
      return;
    }
    if (animationState){
      if (!animationState.start){
        animationState.start = timestamp;
      }
      const elapsed = timestamp - animationState.start;
      const duration = animationState.duration ?? animationDuration;
      const progress = duration > 0 ? Math.min(1, elapsed / duration) : 1;
      draw(progress);
      if (progress < 1){
        animationFrameId = requestAnimationFrame(renderFrame);
        return;
      }
      animationState = null;
      animationFrameId = null;
      return;
    }
    draw(1);
    animationFrameId = null;
  }

  function requestDraw(animate = false){
    if (animationFrameId !== null){
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    animationState = (animate && animationDuration > 0) ? { start: 0, duration: animationDuration } : null;
    if (animationState){
      animationFrameId = requestAnimationFrame(renderFrame);
    } else {
      draw(1);
    }
  }

  if (legendToggle && legendPanel){
    if (!legendPanel.id){
      legendPanel.id = `map-legend-${Math.random().toString(36).slice(2, 10)}`;
    }
    legendToggle.setAttribute('aria-controls', legendPanel.id);
    legendToggle.setAttribute('aria-expanded', 'false');
    legendPanel.addEventListener('keydown', event => {
      if (event.key === 'Escape'){
        event.stopPropagation();
        closeLegend();
        if (typeof legendToggle.focus === 'function'){
          legendToggle.focus();
        }
      }
    });
  }

  const ctx = canvas.getContext('2d');
  const natWidth = canvas.width;
  const natHeight = canvas.height;

  const shapes = { points: [], lines: [], arrows: [], fills: [] };
  let filterYear = null;
  const activeClass = options.yearActiveClass || 'is-active';
  const yearButtons = toolbar ? Array.from(toolbar.querySelectorAll('[data-year]')) : [];
  const defaultHint = hint ? hint.textContent.trim() : '';
  const defaultLegendTitle = legendTitleEl ? legendTitleEl.textContent.trim() : 'Легенда';
  let legendExpanded = false;
  const animationDuration = Math.max(0, Number(options.animationDuration ?? 900));
  let animationFrameId = null;
  let animationState = null;

  function normalizeYear(value){
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    const text = String(value).trim();
    return text ? text : null;
  }

  function yearVisible(sourceYear){
    if (filterYear === null) return true;
    const normalized = normalizeYear(sourceYear);
    return normalized === null ? true : normalized === filterYear;
  }

  function toInternalPoint(event){
    const rect = stage.getBoundingClientRect();
    const scaleX = natWidth / rect.width;
    const scaleY = natHeight / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function clearCanvas(){
    ctx.clearRect(0, 0, natWidth, natHeight);
  }

  function draw(progress = 1){
    clearCanvas();
    const eased = easeOutCubic(progress);
    shapes.fills.forEach(fill => { if (yearVisible(fill.year)) drawFill(fill, eased); });
    shapes.lines.forEach(line => { if (yearVisible(line.year)) drawLine(line, eased); });
    shapes.arrows.forEach(arrow => { if (yearVisible(arrow.year)) drawArrow(arrow, eased); });
    shapes.points.forEach(point => { if (yearVisible(point.year)) drawPoint(point, eased); });
  }

  function setLegendExpanded(state){
    legendExpanded = Boolean(state);
    if (!legend || !legendToggle || !legendPanel) return;
    legendToggle.setAttribute('aria-expanded', legendExpanded ? 'true' : 'false');
    legendPanel.hidden = !legendExpanded;
    legend.classList.toggle('is-open', legendExpanded);
  }

  function toggleLegend(){
    setLegendExpanded(!legendExpanded);
  }

  function closeLegend(){
    setLegendExpanded(false);
  }

  function normalizeLegendItem(item){
    if (item === null || item === undefined) return null;
    if (typeof item === 'number' || typeof item === 'string'){
      const value = String(item).trim();
      const year = normalizeYear(item);
      return {
        label: value || (year !== null ? String(year) : '-'),
        color: year !== null ? pickYearColor(year) : null,
        icon: null,
        description: ''
      };
    }
    if (typeof item !== 'object') return null;
    const year = normalizeYear(item.year ?? item.value ?? item.id ?? item.key);
    const labelSource = item.label ?? item.title ?? item.text ?? (year !== null ? String(year) : '');
    const label = String(labelSource || '').trim() || '-';
    const colorRaw = item.color ?? item.colour ?? (year !== null ? pickYearColor(year) : null);
    const color = colorRaw ? String(colorRaw) : null;
    const iconSource = item.icon ?? item.marker ?? '';
    const icon = iconSource ? String(iconSource).trim() : null;
    const descriptionSource = item.description ?? item.desc ?? item.note ?? '';
    const description = typeof descriptionSource === 'string' ? descriptionSource.trim() : '';
    return { label, color, icon, description };
  }

  function deriveLegendItems(source){
    if (source && typeof source === 'object'){
      const inline = source.legend;
      if (Array.isArray(inline)) return inline;
      if (inline && typeof inline === 'object' && Array.isArray(inline.items)) return inline.items;
    }
    const years = new Set();
    const pools = [];
    if (source && typeof source === 'object'){
      if (Array.isArray(source.points)) pools.push(source.points);
      if (Array.isArray(source.markers)) pools.push(source.markers);
      if (Array.isArray(source.lines)) pools.push(source.lines);
      if (Array.isArray(source.arrows)) pools.push(source.arrows);
      if (Array.isArray(source.fills)) pools.push(source.fills);
    }
    pools.forEach(list => {
      list.forEach(entry => {
        const year = normalizeYear(entry?.year);
        if (year !== null) years.add(year);
      });
    });
    if (years.size){
      return Array.from(years).sort((a, b) => a - b).map(year => ({ year }));
    }
    return Object.keys(YEAR_COLORS)
      .map(value => normalizeYear(value))
      .filter(value => value !== null)
      .sort((a, b) => a - b)
      .map(year => ({ year }));
  }

  function extractLegendTitle(source){
    if (!source || typeof source !== 'object') return null;
    if (typeof source.legendTitle === 'string' && source.legendTitle.trim()) return source.legendTitle.trim();
    const legendMeta = source.legend;
    if (legendMeta && typeof legendMeta === 'object'){
      if (typeof legendMeta.title === 'string' && legendMeta.title.trim()) return legendMeta.title.trim();
      if (typeof legendMeta.heading === 'string' && legendMeta.heading.trim()) return legendMeta.heading.trim();
    }
    return null;
  }

  function renderLegend(items){
    if (!legendList) return;
    legendList.innerHTML = '';
    items.forEach(entry => {
      const item = document.createElement('li');
      item.className = 'map__legend-item';
      const marker = document.createElement('span');
      marker.className = 'map__legend-marker';
      if (entry.color){
        marker.style.setProperty('--legend-color', entry.color);
      } else {
        marker.classList.add('map__legend-marker--empty');
      }
      if (entry.icon){
        const iconEl = document.createElement('span');
        iconEl.className = 'map__legend-icon';
        iconEl.textContent = entry.icon;
        marker.classList.add('map__legend-marker--has-icon');
        marker.appendChild(iconEl);
      }
      item.appendChild(marker);
      const textWrap = document.createElement('span');
      textWrap.className = 'map__legend-text';
      const labelEl = document.createElement('span');
      labelEl.className = 'map__legend-label';
      labelEl.textContent = entry.label || '-';
      textWrap.appendChild(labelEl);
      if (entry.description){
        const noteEl = document.createElement('span');
        noteEl.className = 'map__legend-note';
        noteEl.textContent = entry.description;
        textWrap.appendChild(noteEl);
      }
      item.appendChild(textWrap);
      legendList.appendChild(item);
    });
  }

  function refreshLegend(source){
    if (!legend) return;
    const rawItems = deriveLegendItems(source);
    const normalized = rawItems.map(normalizeLegendItem).filter(Boolean);
    const hasItems = normalized.length > 0;
    if (legendToggle){
      legendToggle.disabled = !hasItems;
    }
    if (legendList){
      if (!hasItems){
        legendList.innerHTML = '';
      } else {
        renderLegend(normalized);
      }
    }
    if (legendTitleEl){
      const customTitle = extractLegendTitle(source);
      legendTitleEl.textContent = customTitle || defaultLegendTitle;
    }
    if (legend instanceof HTMLElement){
      legend.hidden = !hasItems;
    }
    closeLegend();
  }

  function drawPoint(point, progress = 1){
    const visibility = clamp01(progress);
    if (visibility <= 0) return;
    ctx.save();
    ctx.globalAlpha = visibility;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(point.icon || '•', point.x, point.y);
    if (point.label){
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '12px system-ui, sans-serif';
      const label = point.label + (point.year ? ` (${point.year})` : '');
      ctx.fillText(label, point.x + 12, point.y);
    }
    ctx.restore();
  }

  function drawLine(line, progress = 1){
    const pts = line?.points;
    if (!Array.isArray(pts) || pts.length === 0) return;
    const visibility = clamp01(progress);
    if (visibility <= 0) return;
    ctx.save();
    ctx.strokeStyle = pickYearColor(line.year);
    ctx.lineWidth = 3;
    const total = pathLength(pts);
    if (visibility < 1 && total > 0){
      ctx.setLineDash([total]);
      ctx.lineDashOffset = total * (1 - visibility);
    } else {
      ctx.setLineDash([]);
    }
    tracePolyline(pts, false);
    ctx.stroke();
    ctx.restore();
    if (line.label){
      const mid = pts[Math.floor(pts.length / 2)];
      if (mid){
        ctx.save();
        ctx.globalAlpha = visibility;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '14px system-ui, sans-serif';
        const text = line.label + (line.year ? ` ${line.year}` : '');
        ctx.fillText(text, mid.x, mid.y - 6);
        ctx.restore();
      }
    }
  }

  function drawArrow(arrow, progress = 1){
    const pts = arrow?.points;
    if (!Array.isArray(pts) || pts.length === 0) return;
    const visibility = clamp01(progress);
    if (visibility <= 0) return;
    const total = pathLength(pts);
    ctx.save();
    ctx.strokeStyle = pickYearColor(arrow.year);
    ctx.lineWidth = 3;
    if (visibility < 1 && total > 0){
      ctx.setLineDash([total]);
      ctx.lineDashOffset = total * (1 - visibility);
    } else {
      ctx.setLineDash([]);
    }
    tracePolyline(pts, false);
    ctx.stroke();
    ctx.restore();
    if (pts.length >= 2){
      const from = pts[pts.length - 2];
      const to = pts[pts.length - 1];
      const headVisibility = clamp01((visibility - 0.7) / 0.3);
      if (headVisibility > 0){
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const len = 12;
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = pickYearColor(arrow.year);
        ctx.globalAlpha = headVisibility;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - len * Math.cos(angle - Math.PI / 6), to.y - len * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - len * Math.cos(angle + Math.PI / 6), to.y - len * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        ctx.restore();
      }
    }
    if (arrow.label){
      const mid = pts[Math.floor(pts.length / 2)];
      if (mid){
        ctx.save();
        ctx.globalAlpha = visibility;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '14px system-ui, sans-serif';
        const text = arrow.label + (arrow.year ? ` ${arrow.year}` : '');
        ctx.fillText(text, mid.x, mid.y - 6);
        ctx.restore();
      }
    }
  }

  function drawFill(fill, progress = 1){
    const pts = fill?.points;
    if (!Array.isArray(pts) || pts.length === 0) return;
    const visibility = clamp01(progress);
    if (visibility <= 0) return;
    const alpha = Number(fill.alpha ?? 0.35);
    const color = fill.color || '#60a5fa';

    ctx.save();
    tracePolyline(pts, true);
    ctx.clip();
    const bounds = polygonBounds(pts);
    const spanY = Math.max(1, bounds.maxY - bounds.minY);
    const startY = bounds.maxY - spanY * visibility;
    const clampedStart = Math.min(bounds.maxY, Math.max(bounds.minY, startY));
    const gradient = ctx.createLinearGradient(0, clampedStart, 0, bounds.maxY);
    gradient.addColorStop(0, hexToRgba(color, 0));
    gradient.addColorStop(0.6, hexToRgba(color, alpha * 0.6));
    gradient.addColorStop(1, hexToRgba(color, alpha));
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(0, bounds.maxY - clampedStart);
    if (height > 0){
      ctx.fillStyle = gradient;
      ctx.fillRect(bounds.minX, clampedStart, width, height);
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = pickYearColor(fill.year);
    ctx.lineWidth = 2;
    const perimeter = polygonPerimeter(pts);
    if (visibility < 1 && perimeter > 0){
      ctx.setLineDash([perimeter]);
      ctx.lineDashOffset = perimeter * (1 - visibility);
    } else {
      ctx.setLineDash([]);
    }
    tracePolyline(pts, true);
    ctx.stroke();
    ctx.restore();

    if (fill.label){
      const mid = pts[Math.floor(pts.length / 2)];
      if (mid){
        ctx.save();
        ctx.globalAlpha = visibility;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = '14px system-ui, sans-serif';
        const text = fill.label + (fill.year ? ` ${fill.year}` : '');
        ctx.fillText(text, mid.x, mid.y - 6);
        ctx.restore();
      }
    }
  }

  function pickYearColor(year){
    const key = normalizeYear(year);
    return YEAR_COLORS[key] || '#000';
  }

  function hexToRgba(hex, alpha){
    const clean = String(hex || '').replace('#', '');
    const r = parseInt(clean.slice(0, 2) || '00', 16);
    const g = parseInt(clean.slice(2, 4) || '00', 16);
    const b = parseInt(clean.slice(4, 6) || '00', 16);
    const a = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 0.35;
    return `rgba(${r},${g},${b},${a})`;
  }

  function clamp01(value){
    if (!Number.isFinite(value)) return 0;
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
  }

  function easeOutCubic(value){
    const t = clamp01(value);
    return 1 - Math.pow(1 - t, 3);
  }

  function tracePolyline(points, close = false){
    ctx.beginPath();
    points.forEach((pt, index) => index === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
    if (close){
      ctx.closePath();
    }
  }

  function pathLength(points){
    let total = 0;
    for (let i = 1; i < points.length; i += 1){
      const prev = points[i - 1];
      const current = points[i];
      total += Math.hypot(current.x - prev.x, current.y - prev.y);
    }
    return total;
  }

  function polygonPerimeter(points){
    if (!Array.isArray(points) || points.length === 0) return 0;
    let total = pathLength(points);
    if (points.length > 2){
      const first = points[0];
      const last = points[points.length - 1];
      total += Math.hypot(first.x - last.x, first.y - last.y);
    }
    return total;
  }

  function polygonBounds(points){
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    points.forEach(pt => {
      bounds.minX = Math.min(bounds.minX, pt.x);
      bounds.maxX = Math.max(bounds.maxX, pt.x);
      bounds.minY = Math.min(bounds.minY, pt.y);
      bounds.maxY = Math.max(bounds.maxY, pt.y);
    });
    if (!Number.isFinite(bounds.minX)){
      bounds.minX = 0;
      bounds.maxX = 0;
      bounds.minY = 0;
      bounds.maxY = 0;
    }
    return bounds;
  }

  function nearPoint(point, radius = 12){
    for (let i = 0; i < shapes.points.length; i += 1){
      const candidate = shapes.points[i];
      if (Math.hypot(candidate.x - point.x, candidate.y - point.y) <= radius) return i;
    }
    return -1;
  }

  function segmentDistance(a, b, p){
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    if (length === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const ratio = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length));
    const projX = a.x + ratio * dx;
    const projY = a.y + ratio * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  }

  function findShape(point, tolerance = 6){
    const pool = [
      ...shapes.lines.map(obj => ({ obj, type: 'Линия' })),
      ...shapes.arrows.map(obj => ({ obj, type: 'Стрелка' })),
      ...shapes.fills.map(obj => ({ obj, type: 'Контур' })),
    ];
    for (const item of pool){
      if (!yearVisible(item.obj.year)) continue;
      const pts = item.obj.points || [];
      for (let i = 1; i < pts.length; i += 1){
        if (segmentDistance(pts[i - 1], pts[i], point) <= tolerance) return item;
      }
    }
    return null;
  }

  function clampTooltip(left, top){
    const rect = stage.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const clampedLeft = Math.min(Math.max(8, left), Math.max(8, rect.width - width - 8));
    const clampedTop = Math.min(Math.max(8, top), Math.max(8, rect.height - height - 8));
    tooltip.style.left = `${clampedLeft}px`;
    tooltip.style.top = `${clampedTop}px`;
  }

  function showInfo(payload, internalPoint){
    const rect = stage.getBoundingClientRect();
    const scaleX = rect.width / natWidth;
    const scaleY = rect.height / natHeight;
    const left = internalPoint.x * scaleX + 16;
    const top = internalPoint.y * scaleY + 16;

    tooltip.innerHTML = '';
    let hasContent = false;

    if (payload && typeof payload === 'object' && !Array.isArray(payload)){
      const title = payload.title ?? payload.label ?? '';
      const body = payload.body ?? payload.description ?? payload.desc ?? payload.text ?? '';
      if (title){
        const titleEl = document.createElement('div');
        titleEl.className = 'map__tooltip-title';
        titleEl.textContent = title;
        tooltip.appendChild(titleEl);
        hasContent = true;
      }
      const segments = Array.isArray(body) ? body : String(body || '').split(/\r?\n\s*\r?\n/);
      segments.forEach(segment => {
        const trimmed = String(segment || '').trim();
        if (!trimmed) return;
        const bodyEl = document.createElement('div');
        bodyEl.className = 'map__tooltip-body';
        bodyEl.textContent = trimmed;
        tooltip.appendChild(bodyEl);
        hasContent = true;
      });
    } else if (typeof payload === 'string'){
      tooltip.textContent = payload;
      hasContent = Boolean(payload);
    }

    if (!hasContent){
      tooltip.textContent = 'Нет данных';
    }

    tooltip.style.display = 'block';
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    clampTooltip(left, top);
  }

  function hideInfo(){
    tooltip.style.display = 'none';
  }

  function applyData(data){
    if (!data || typeof data !== 'object') return;
    shapes.points = Array.isArray(data.points) ? data.points : (Array.isArray(data.markers) ? data.markers : []);
    shapes.lines = Array.isArray(data.lines) ? data.lines : [];
    shapes.arrows = Array.isArray(data.arrows) ? data.arrows : [];
    shapes.fills = Array.isArray(data.fills) ? data.fills : [];
    refreshLegend(data);
    hideInfo();
    requestDraw(true);
  }

  function updateHint(message, status){
    if (!hint) return;
    if (message){
      hint.textContent = message;
    } else if (defaultHint){
      hint.textContent = defaultHint;
    }
    if (status){
      hint.dataset.status = status;
    } else {
      delete hint.dataset.status;
    }
  }

  function onCanvasClick(event){
    const internal = toInternalPoint(event);
    const pointIndex = nearPoint(internal);
    if (pointIndex >= 0){
      const marker = shapes.points[pointIndex];
      const icon = marker.icon || '•';
      const titleParts = [icon];
      if (marker.label) titleParts.push(String(marker.label));
      if (marker.year) titleParts.push(String(marker.year));
      const heading = titleParts.join(' ').replace(/\s+/g, ' ').trim();
      const rawDescription = marker.desc ?? marker.description ?? marker.text ?? '';
      const description = typeof rawDescription === 'string' ? rawDescription.trim() : String(rawDescription || '').trim();
      const safeHeading = heading || 'Событие';
      const payload = description ? { title: safeHeading, body: description } : safeHeading;
      showInfo(payload, marker);
      return;
    }
    const shape = findShape(internal);
    if (shape){
      const obj = shape.obj;
      const base = obj.label || shape.type || '';
      const textLabel = `${base}${obj.year ? ` ${obj.year}` : ''}`.trim();
      const rawDescription = obj.desc ?? obj.description ?? obj.text ?? '';
      const description = typeof rawDescription === 'string' ? rawDescription.trim() : String(rawDescription || '').trim();
      const heading = textLabel || 'Событие';
      const payload = description ? { title: heading, body: description } : heading;
      showInfo(payload, internal);
    } else {
      hideInfo();
    }
  }

  function bindFilters(){
    yearButtons.forEach(button => {
      button.addEventListener('click', () => {
        yearButtons.forEach(item => item.classList.remove(activeClass));
        button.classList.add(activeClass);
        filterYear = normalizeYear(button.dataset.year);
        hideInfo();
        requestDraw(true);
      });
    });
  }

  function resolveDataUrl(){
    if (typeof options.url === 'string') return options.url;
    if (container?.dataset.mapUrl) return container.dataset.mapUrl;
    return DEFAULT_DATA_URL;
  }

  async function loadData(){
    const inline = options.data || globalThis.APP_MAP_DATA;
    if (inline){
      applyData(inline);
      updateHint(defaultHint, null);
      return;
    }
    const url = resolveDataUrl();
    if (!url) return;
    updateHint(defaultHint || 'Загружаем данные…', null);
    try{
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
      const payload = await response.json();
      applyData(payload);
      updateHint(defaultHint, null);
    }catch(error){
      console.warn('[map] data request failed', error);
            updateHint(`Не удалось загрузить ${url}: ${error.message}`, 'error');
    }
  }

  canvas.addEventListener('click', onCanvasClick);
  stage.addEventListener('pointerleave', hideInfo);
  stage.addEventListener('pointerdown', hideInfo);

  if (legendToggle){
    legendToggle.addEventListener('click', toggleLegend);
  }

  refreshLegend({});
  bindFilters();
  requestDraw(false);
  loadData();

  return {
    redraw(){
      requestDraw(false);
    },
    setYear(value){
      filterYear = normalizeYear(value);
      hideInfo();
      requestDraw(true);
    },
    setData(data){
      applyData(data);
      updateHint(defaultHint, null);
    },
  };
}


