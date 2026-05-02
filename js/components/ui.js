export function pb(pct, renk) {
  return `<div class="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden my-2">
    <div class="h-full rounded-full transition-all" style="width:${Math.min(pct, 100)}%;background:${renk}"></div>
  </div>`;
}

export function ab(a) {
  return `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-label-sm font-label-sm" style="background:${a.renk}20;border:1px solid ${a.renk}50;color:${a.renk}">${a.icon} ${a.tip}</span>`;
}

export function guzSA(ilce, il, renk) {
  return `<div class="flex flex-col gap-1 mt-2 pl-2 border-l-2" style="border-color:${renk}">
    <div class="flex items-center gap-2 text-body-sm">
      <span class="w-2 h-2 rounded-full bg-secondary flex-shrink-0"></span>
      <span class="text-secondary font-semibold">Yalova (Kalkış)</span>
    </div>
    <div class="flex items-center gap-2 text-body-sm">
      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${renk}"></span>
      <span class="text-on-surface">${ilce}</span>
      <span class="text-on-surface-variant text-label-sm">· ${il}</span>
    </div>
    <div class="flex items-center gap-2 text-body-sm">
      <span class="w-2 h-2 rounded-full bg-surface-container-highest flex-shrink-0"></span>
      <span class="text-on-surface-variant text-label-sm">Yalova (Dönüş)</span>
    </div>
  </div>`;
}

export function guzP(k) {
  let h = `<div class="flex flex-col gap-1 mt-2 pl-2 border-l-2" style="border-color:${k.renk}">
    <div class="flex items-center gap-2 text-body-sm">
      <span class="w-2 h-2 rounded-full bg-secondary flex-shrink-0"></span>
      <span class="text-secondary font-semibold">Yalova (Kalkış)</span>
    </div>`;
  k.noktalar.forEach(n => {
    const yakaLabel = n.ilce.yaka
      ? `<span class="text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-1" style="background:${n.ilce.yaka==='Anadolu'?'#10B98120':'#3B82F620'};color:${n.ilce.yaka==='Anadolu'?'#10B981':'#3B82F6'}">${n.ilce.yaka}</span>`
      : '';
    h += `<div class="flex items-center gap-2 text-body-sm">
      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${k.renk}"></span>
      <span class="text-on-surface">${n.ilce.ad}</span>
      <span class="text-on-surface-variant text-label-sm">· ${n.ilce.il}</span>
      ${yakaLabel}
      <span class="ml-auto text-label-sm font-semibold" style="color:${k.renk}">${n.tonaj} ton</span>
    </div>`;
  });
  h += `<div class="flex items-center gap-2 text-body-sm">
    <span class="w-2 h-2 rounded-full bg-surface-container-highest flex-shrink-0"></span>
    <span class="text-on-surface-variant text-label-sm">Yalova (Dönüş)</span>
  </div></div>`;
  return h;
}

export function piInput(id, val, fn) {
  const ok = (val || '').trim().length >= 3;
  return `<div class="flex items-center gap-2">
    <input id="${id}" type="text" placeholder="34 ABC 123" maxlength="12" value="${val || ''}"
      oninput="${fn}"
      class="font-mono text-sm uppercase border ${ok ? 'border-green-500' : 'border-outline-variant'} rounded-DEFAULT px-3 py-2 w-36 bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
      style="letter-spacing:0.1em"/>
    <span id="${id}-c" class="${ok ? 'text-green-600' : 'text-on-surface-variant'} text-label-sm">${ok ? '✓' : 'Plaka'}</span>
  </div>`;
}

export function acBox(id, val, fn) {
  return `<div class="mt-2">
    <textarea id="${id}" class="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[56px]"
      placeholder="Açıklama..." oninput="${fn}">${val || ''}</textarea>
  </div>`;
}

export function statusBadge(durum) {
  const map = {
    'Planlandı':      'bg-surface-container-high text-on-surface-variant',
    'Yüklendi':       'bg-blue-100 text-blue-800',
    'Yolda':          'bg-secondary-fixed text-on-secondary-fixed-variant',
    'Teslim Edildi':  'bg-primary-fixed text-on-primary-fixed',
    'İptal':          'bg-error-container text-on-error-container',
  };
  const cls = map[durum] || map['Planlandı'];
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm ${cls}">${durum}</span>`;
}

export function loadingHTML() {
  return `<div class="flex items-center justify-center h-64">
    <div class="flex flex-col items-center gap-4">
      <div class="animate-spin w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full"></div>
      <p class="text-on-surface-variant text-body-sm">Yükleniyor...</p>
    </div>
  </div>`;
}
