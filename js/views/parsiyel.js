import { S, render, showToast } from '../state.js';
import { pKaydet, pSil2, pGetir } from '../firebase.js';
import { PARSIYEL } from '../data.js';
import { grupla, aracTipi, fmtTarih, tonajiBol, rotaSirala } from '../algorithms.js';
import { pb, ab, guzP, piInput, acBox } from '../components/ui.js';

// ── Yaka badge ──────────────────────────────────────────────────────────────
function yakaBadge(yaka) {
  if (!yaka) return '';
  const isAnadolu = yaka === 'Anadolu';
  return `<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
    style="background:${isAnadolu ? '#10B98120' : '#3B82F620'};color:${isAnadolu ? '#10B981' : '#3B82F6'}"
  >${yaka}</span>`;
}

// ── Sürüklenebilir rota gösterimi (araç planı içi) ──────────────────────────
function renderDraggableRoute(k, isDraggable) {
  let h = `<div class="flex flex-col gap-0.5 mt-2 pl-2 border-l-2 select-none" style="border-color:${k.renk}">
    <div class="flex items-center gap-2 text-body-sm py-1">
      <span class="w-2 h-2 rounded-full bg-secondary flex-shrink-0"></span>
      <span class="text-secondary font-semibold">Yalova (Kalkış)</span>
    </div>`;

  k.noktalar.forEach((n, idx) => {
    h += `<div
      class="flex items-center gap-1.5 text-body-sm py-1 px-1 rounded-lg group transition-colors ${isDraggable ? 'cursor-grab hover:bg-surface-container' : ''}"
      ${isDraggable ? `draggable="true" ondragstart="PDragStart(${k.no},${idx})"` : ''}>
      ${isDraggable ? `<span class="material-symbols-outlined text-[13px] text-on-surface-variant opacity-0 group-hover:opacity-50 flex-shrink-0 transition-opacity">drag_indicator</span>` : ''}
      <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${k.renk}"></span>
      <span class="text-on-surface">${n.ilce.ad}</span>
      <span class="text-on-surface-variant text-label-sm">· ${n.ilce.il}</span>
      ${yakaBadge(n.ilce.yaka)}
      ${S.p_musteri ? `<span class="text-on-surface-variant text-label-sm">(${S.p_musteri})</span>` : ''}
      <span class="ml-auto text-label-sm font-semibold flex-shrink-0" style="color:${k.renk}">${n.tonaj} ton</span>
    </div>`;
  });

  h += `<div class="flex items-center gap-2 text-body-sm py-1">
    <span class="w-2 h-2 rounded-full bg-surface-container-highest flex-shrink-0"></span>
    <span class="text-on-surface-variant text-label-sm">Yalova (Dönüş)</span>
  </div></div>`;
  return h;
}

// ── Araç kartı (sürükle & bırak drop zone dahil) ──────────────────────────
function renderVehicleCard(k, plan) {
  const isDraggable = plan.length > 1;
  const pct = Math.round((k.toplamTon / k.maxTon) * 100);
  const isSrc = S.p_drag_src?.vNo === k.no;

  // Yaka etiketi (araç başlığı için)
  const aracYaka = k.noktalar.find(n => n.ilce.yaka)?.ilce.yaka;

  return `<div
    class="border border-outline-variant rounded-2xl p-4 transition-all ${isSrc ? 'opacity-50' : ''}"
    style="border-left:4px solid ${k.renk}"
    ondragover="event.preventDefault();this.style.boxShadow='0 0 0 2px ${k.renk}'"
    ondragleave="this.style.boxShadow=''"
    ondrop="this.style.boxShadow='';PDrop(${k.no},event)">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2 flex-wrap">
        ${ab(k)}
        <span class="text-xs text-on-surface-variant">${k.no}. araç · ${k.noktalar.length} durak</span>
        ${aracYaka ? yakaBadge(aracYaka + ' Yakası') : ''}
      </div>
      <div class="text-right flex-shrink-0 ml-2">
        <div class="text-sm font-bold" style="color:${k.renk}">${k.toplamTon.toFixed(1)} / ${k.maxTon} t</div>
        <div class="text-xs text-on-surface-variant">${pct}% dolu</div>
      </div>
    </div>
    ${pb(pct, k.renk)}
    ${renderDraggableRoute(k, isDraggable)}
    ${isDraggable ? `<div class="mt-2 text-[10px] text-on-surface-variant text-center opacity-50">
      <span class="material-symbols-outlined text-[12px] align-text-bottom">open_with</span>
      Durağı başka araca sürükle
    </div>` : ''}
  </div>`;
}

// ── Yeni Plan ──────────────────────────────────────────────────────────────
function rPYeni() {
  const PI = S.p_il
    ? (PARSIYEL[S.p_il] || { ilceler: [] }).ilceler.filter(i => !S.p_sec.find(s => s.ilce.ad === i.ad))
    : [];

  // Kullanıcı sürükle & bırak yapmışsa S.p_plan, yoksa grupla'dan hesapla
  const km = S.p_plan || (S.p_sec.length ? grupla(S.p_sec) : []);
  const top = S.p_sec.reduce((a, b) => a + b.tonaj, 0);

  // ── Sol: il/ilçe seçimi ──
  let ilOpts = `<option value="">— İl seçin —</option>`;
  Object.keys(PARSIYEL).forEach(il => {
    ilOpts += `<option value="${il}"${S.p_il === il ? ' selected' : ''}>${il}</option>`;
  });

  let ilceOpts = `<option value="">— İlçe seçin —</option>`;
  PI.forEach(i => {
    const yakaLabel = i.yaka ? ` (${i.yaka})` : '';
    ilceOpts += `<option value="${i.ad}"${S.p_ilce === i.ad ? ' selected' : ''}>${i.ad}${yakaLabel}</option>`;
  });

  const musteriOpts = S.musteriler.map(m =>
    `<option value="${m.ad}"${S.p_musteri === m.ad ? ' selected' : ''}>${m.ad}</option>`
  ).join('');

  // Seçilen duraklar listesi
  let secH = '';
  if (S.p_sec.length) {
    secH = `<div class="flex items-center justify-between mb-2 mt-3">
      <span class="text-xs text-on-surface-variant font-medium">${S.p_sec.length} nokta · Toplam <strong class="text-on-surface">${top.toFixed(1)} ton</strong></span>
      <button onclick="PTemizle()" class="text-xs text-error hover:underline">Tümünü sil</button>
    </div>
    <div class="space-y-1.5">`;
    S.p_sec.forEach(item => {
      const rk = (PARSIYEL[item.ilce.il] || { renk: '#888' }).renk;
      secH += `<div class="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant">
        <div class="w-2 h-2 rounded-full flex-shrink-0" style="background:${rk}"></div>
        <span class="text-sm font-medium text-on-surface flex-1">${item.ilce.ad}</span>
        <span class="text-xs text-on-surface-variant">${item.ilce.il}</span>
        ${yakaBadge(item.ilce.yaka)}
        <span class="text-xs font-semibold text-on-surface ml-1">${item.tonaj} t</span>
        <button onclick="PCikar('${item.ilce.ad}')" class="ml-1 text-on-surface-variant hover:text-error text-xs leading-none">✕</button>
      </div>`;
    });
    secH += `</div>`;
  }

  // ── Sağ: araç planı ──
  let sagH = '';
  if (!km.length) {
    sagH = `<div class="flex flex-col items-center justify-center h-48 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-[40px] mb-2" style="color:#c6c6cd">inventory_2</span>
      <div class="text-sm font-medium">Varış noktaları ekleyin</div>
      <div class="text-xs mt-1">Kamyonet ≤10t · Kamyon ≤19t · TIR ≤24t</div>
    </div>`;
  } else {
    const toplam = km.reduce((a, k) => a + k.toplamTon, 0);
    sagH = `<div class="text-xs text-on-surface-variant mb-3">
      ${toplam.toFixed(1)} ton için <strong class="text-on-surface">${km.length} araç</strong> hesaplandı
    </div>
    <div class="space-y-3">
      ${km.map(k => renderVehicleCard(k, km)).join('')}
    </div>
    <button onclick="PPGonder()" ${S.saving ? 'disabled' : ''} class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
      <span class="material-symbols-outlined text-[18px]">directions_car</span>
      Plaka Girişine Gönder
    </button>`;
  }

  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div>
      <div class="bg-surface border border-outline-variant rounded-2xl p-5 mb-4">
        <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Müşteri (Opsiyonel)</div>
        <select onchange="PMUS(this.value)" class="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">— Müşteri seçin —</option>
          ${musteriOpts}
        </select>
      </div>
      <div class="bg-surface border border-outline-variant rounded-2xl p-5">
        <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Varış Noktası Ekle</div>
        <select onchange="PIL(this.value)" class="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary mb-2">
          ${ilOpts}
        </select>
        <select onchange="PILCE(this.value)" ${S.p_il ? '' : 'disabled'} class="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary mb-3 disabled:opacity-50">
          ${ilceOpts}
        </select>
        <div class="flex gap-2">
          <input id="p_ton" type="number" min="0.1" max="24" step="0.1" placeholder="Tonaj (ton)"
            class="flex-1 border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"/>
          <button onclick="PEkle()" class="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            + Ekle
          </button>
        </div>
        ${secH}
      </div>
    </div>
    <div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Araç Planı</div>
      ${sagH}
    </div>
  </div>`;
}

// ── Plaka Bekleme ──────────────────────────────────────────────────────────
function rPPlaka() {
  if (!S.p_bekleme.length) {
    return `<div class="flex flex-col items-center justify-center h-48 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-[40px] mb-2" style="color:#c6c6cd">directions_car</span>
      <div class="text-sm font-medium">Bekleyen plan yok</div>
      <div class="text-xs mt-1">Yeni Plan sekmesinden oluşturun</div>
    </div>`;
  }

  let h = `<div class="space-y-4">`;
  S.p_bekleme.forEach((plan, pi) => {
    const musteriRec = plan.musteri ? S.musteriler.find(m => m.ad === plan.musteri) : null;
    const sevkAdresi = musteriRec?.sevk_adresi || '';
    h += `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-on-surface">Plan #${pi + 1} — ${plan.kamyonlar.length} Araç · ${plan.toplam_ilce} Nokta · ${plan.toplam_ton.toFixed(1)} ton</div>
          <div class="text-xs text-on-surface-variant mt-0.5">Her araç için plaka girip ayrı ayrı kaydedin</div>
        </div>
        <button onclick="PBS(${pi})" class="ml-3 p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      ${plan.musteri ? `<div class="mb-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-semibold" style="color:#8B5CF6">
            <span class="material-symbols-outlined text-[14px] align-text-bottom">business</span>
            ${plan.musteri}
          </span>
          ${sevkAdresi ? `<span class="text-xs text-on-surface-variant">· ${sevkAdresi}</span>` : ''}
        </div>
        ${musteriRec && (musteriRec.il || musteriRec.ilce) ? `<div class="text-xs text-on-surface-variant mt-1">📍 ${[musteriRec.il, musteriRec.ilce].filter(Boolean).join(' / ')}</div>` : ''}
      </div>` : ''}
      <div class="space-y-3">`;

    plan.kamyonlar.forEach(k => {
      const pct = Math.round((k.toplamTon / k.maxTon) * 100);
      const plakaTamam = (k.plaka || '').trim().length >= 3;
      h += `<div class="border border-outline-variant rounded-xl p-4" style="border-left:3px solid ${k.renk}">
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div class="flex items-center gap-2">${ab(k)}<span class="text-sm font-semibold text-on-surface">${k.no}. Araç</span><span class="text-xs text-on-surface-variant">${k.noktalar.length} durak · ${k.toplamTon.toFixed(1)}/${k.maxTon}t · %${pct}</span></div>
          ${piInput(`pp-${pi}-${k.no}`, k.plaka, `PP(${pi},${k.no},this.value)`)}
        </div>
        ${pb(pct, k.renk)}
        ${guzP(k)}
        ${acBox(`pa-${pi}-${k.no}`, k.aciklama, `PA(${pi},${k.no},this.value)`)}
        <button id="pbtn-${pi}-${k.no}" onclick="PPK(${pi},${k.no})" ${!plakaTamam || S.saving ? 'disabled' : ''}
          class="mt-3 w-full px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
          ${S.saving ? 'Kaydediliyor...' : plakaTamam ? 'Kaydet' : 'Plaka Girin'}
        </button>
      </div>`;
    });

    h += `</div></div>`;
  });

  return h + '</div>';
}

// ── Geçmiş ──────────────────────────────────────────────────────────────────
function rPGecmis() {
  if (!S.pGecmis.length) {
    return `<div class="flex flex-col items-center justify-center h-48 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-[40px] mb-2" style="color:#c6c6cd">history</span>
      <div class="text-sm font-medium">Henüz parsiyel plan kaydı yok</div>
    </div>`;
  }

  const toplamArac = S.pGecmis.reduce((a, p) => a + (p.kamyon_sayisi || 0), 0);
  const toplamTon  = S.pGecmis.reduce((a, p) => a + (p.toplam_ton || 0), 0);

  let h = `<div class="grid grid-cols-3 gap-3 mb-4">
    <div class="bg-surface border border-outline-variant rounded-2xl p-4 text-center">
      <div class="text-2xl font-bold text-on-surface">${S.pGecmis.length}</div>
      <div class="text-xs text-on-surface-variant mt-0.5 uppercase tracking-wide">Toplam Plan</div>
    </div>
    <div class="bg-surface border border-outline-variant rounded-2xl p-4 text-center">
      <div class="text-2xl font-bold text-on-surface">${toplamArac}</div>
      <div class="text-xs text-on-surface-variant mt-0.5 uppercase tracking-wide">Toplam Araç</div>
    </div>
    <div class="bg-surface border border-outline-variant rounded-2xl p-4 text-center">
      <div class="text-2xl font-bold text-on-surface">${toplamTon.toFixed(0)} t</div>
      <div class="text-xs text-on-surface-variant mt-0.5 uppercase tracking-wide">Toplam Yük</div>
    </div>
  </div>
  <div class="space-y-4">`;

  S.pGecmis.forEach(p => {
    h += `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="flex items-start justify-between mb-3">
        <div>
          <div class="text-sm font-semibold text-on-surface">${p.kamyon_sayisi || 0} Araç · ${p.toplam_ilce || 0} Nokta · ${(p.toplam_ton || 0).toFixed(1)} ton</div>
          <div class="text-xs text-on-surface-variant mt-0.5">${fmtTarih(p.tarih)}</div>
        </div>
        <button onclick="PSil('${p.id}')" class="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      <div class="space-y-2">`;

    (p.kamyonlar || []).forEach(k => {
      const a = aracTipi(k.toplam_ton || 0);
      const pct = Math.round(((k.toplam_ton || 0) / (k.max_ton || 24)) * 100);
      const fk = {
        renk: a.renk,
        noktalar: (k.noktalar || []).map(n => ({
          ilce: { ad: n.ilce || n, il: n.il || '', yaka: n.yaka || null },
          tonaj: n.tonaj || 0,
        })),
      };
      h += `<div class="border border-outline-variant rounded-xl p-3" style="border-left:3px solid ${a.renk}">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">${ab(a)}<span class="text-sm font-semibold text-on-surface">${k.no}. Araç</span>${k.plaka ? `<span class="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">${k.plaka}</span>` : ''}</div>
          <div class="text-right">
            <div class="text-sm font-bold" style="color:${a.renk}">${(k.toplam_ton || 0).toFixed(1)} / ${k.max_ton || 24} t</div>
            <div class="text-xs text-on-surface-variant">${pct}% dolu</div>
          </div>
        </div>
        ${pb(pct, a.renk)}
        ${guzP(fk)}
        ${k.aciklama ? `<div class="mt-2 text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">${k.aciklama}</div>` : ''}
      </div>`;
    });

    h += `</div></div>`;
  });

  return h + '</div>';
}

// ── Ana render ───────────────────────────────────────────────────────────────
export function rP(S_param) {
  const localS = S_param || S;
  const at = localS.at.p;
  const bb = localS.p_bekleme.length;

  const tabClass = key => at === key
    ? 'px-4 py-2 rounded-xl text-sm font-semibold bg-surface border border-outline-variant text-on-surface'
    : 'px-4 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors';

  return `<div>
    <div class="flex items-center gap-2 mb-4">
      <button onclick="PT('yeni')" class="${tabClass('yeni')}">+ Yeni Plan</button>
      <button onclick="PT('plaka')" class="${tabClass('plaka')} relative">
        Plaka Bekleme
        ${bb ? `<span class="ml-1.5 inline-flex items-center justify-center w-5 h-5 bg-error text-on-error text-[10px] font-bold rounded-full">${bb}</span>` : ''}
      </button>
      <button onclick="PT('gecmis')" class="${tabClass('gecmis')}">Geçmiş (${localS.pGecmis.length})</button>
    </div>
    ${at === 'yeni' ? rPYeni() : at === 'plaka' ? rPPlaka() : rPGecmis()}
  </div>`;
}

// ── Handlers ─────────────────────────────────────────────────────────────────
window.PT    = t => { S.at.p = t; render(); };
window.PIL   = v => { S.p_il = v; S.p_ilce = ''; render(); };
window.PILCE = v => { S.p_ilce = v; render(); };
window.PMUS  = v => { S.p_musteri = v; };

window.PEkle = () => {
  const inp = document.getElementById('p_ton');
  const ton = inp ? parseFloat(inp.value) : 0;
  if (!S.p_il || !S.p_ilce || !ton || ton <= 0) { showToast('İl, ilçe ve tonaj seçmelisiniz!', false); return; }
  const ilce = (PARSIYEL[S.p_il] || { ilceler: [] }).ilceler.find(i => i.ad === S.p_ilce);
  if (!ilce) { showToast('İlçe bulunamadı!', false); return; }
  S.p_sec.push({ ilce: { ...ilce, il: S.p_il }, tonaj: ton });
  S.p_ilce = '';
  S.p_plan = null; // planı sıfırla
  if (inp) inp.value = '';
  render();
};

window.PCikar   = ad => { S.p_sec = S.p_sec.filter(s => s.ilce.ad !== ad); S.p_plan = null; render(); };
window.PTemizle = ()  => { S.p_sec = []; S.p_plan = null; render(); };

window.PPGonder = () => {
  const km = S.p_plan ? S.p_plan : grupla(S.p_sec);
  if (!km.length) return;
  const top       = km.reduce((a, k) => a + k.toplamTon, 0);
  const ilceSayisi = km.reduce((a, k) => a + k.noktalar.length, 0);
  S.p_bekleme.push({
    kamyonlar: km.map(k => ({ ...k, plaka: '', aciklama: '' })),
    toplam_ton: top,
    toplam_ilce: ilceSayisi,
    musteri: S.p_musteri,
  });
  S.p_sec = []; S.p_musteri = ''; S.p_plan = null; S.at.p = 'plaka'; render();
};

// ── Sürükle & Bırak ──────────────────────────────────────────────────────────
window.PDragStart = (vNo, sIdx) => {
  S.p_drag_src = { vNo, sIdx };
};

window.PDrop = (targetVNo, e) => {
  e.preventDefault();
  const src = S.p_drag_src;
  if (!src) return;
  S.p_drag_src = null;

  if (src.vNo === targetVNo) return; // aynı araç — işlem yok

  // Planı state'e aktar (henüz yapılmamışsa)
  if (!S.p_plan) {
    S.p_plan = grupla(S.p_sec).map(k => ({ ...k, noktalar: k.noktalar.map(n => ({ ...n })) }));
  }

  const srcV = S.p_plan.find(k => k.no === src.vNo);
  const tgtV = S.p_plan.find(k => k.no === targetVNo);
  if (!srcV || !tgtV) return;

  const stop = srcV.noktalar[src.sIdx];
  if (!stop) return;

  // Kapasite kontrolü (mutlak max 24t)
  if (tgtV.toplamTon + stop.tonaj > 24) {
    showToast(`Araç doldu! Eklenebilecek maksimum: ${(24 - tgtV.toplamTon).toFixed(1)} t`, false);
    return;
  }

  // Durağı taşı
  srcV.noktalar.splice(src.sIdx, 1);
  tgtV.noktalar.push(stop);

  // Tonajları güncelle
  srcV.toplamTon = parseFloat(srcV.noktalar.reduce((a, n) => a + n.tonaj, 0).toFixed(2));
  tgtV.toplamTon = parseFloat((tgtV.toplamTon + stop.tonaj).toFixed(2));

  // Araç tiplerini yeniden hesapla
  [srcV, tgtV].forEach(v => {
    const a = aracTipi(v.toplamTon);
    v.tip = a.tip; v.icon = a.icon; v.renk = a.renk; v.maxTon = a.max;
  });

  // Rotayı yeniden sırala
  if (srcV.noktalar.length) srcV.noktalar = rotaSirala(srcV.noktalar);
  tgtV.noktalar = rotaSirala(tgtV.noktalar);

  // Boş araçları temizle, numaralandır
  S.p_plan = S.p_plan.filter(k => k.noktalar.length > 0);
  S.p_plan.sort((a, b) => b.toplamTon - a.toplamTon);
  S.p_plan.forEach((k, i) => { k.no = i + 1; });

  render();
};

// ── Firebase kayıt/sil handlers ──────────────────────────────────────────────
window.PP  = (pi, kno, val) => {
  const k = S.p_bekleme[pi].kamyonlar.find(x => x.no === kno);
  if (k) k.plaka = val.toUpperCase();
  const ok = val.trim().length >= 3;
  const btn = document.getElementById(`pbtn-${pi}-${kno}`);
  if (btn) { btn.disabled = !ok; btn.textContent = ok ? 'Kaydet' : 'Plaka Girin'; }
};
window.PA  = (pi, kno, val) => {
  const k = S.p_bekleme[pi].kamyonlar.find(x => x.no === kno);
  if (k) k.aciklama = val;
};
window.PPK = async (pi, kno) => {
  const plan = S.p_bekleme[pi]; if (!plan) return;
  const k    = plan.kamyonlar.find(x => x.no === kno); if (!k) return;
  S.saving = true; render();
  try {
    await pKaydet({
      toplam_ton: k.toplamTon, toplam_ilce: k.noktalar.length, kamyon_sayisi: 1,
      kamyonlar: [{ no: k.no, tip: k.tip, icon: k.icon, renk: k.renk, toplam_ton: k.toplamTon, max_ton: k.maxTon,
        plaka: k.plaka, aciklama: k.aciklama || '',
        noktalar: k.noktalar.map(n => ({ ilce: n.ilce.ad, il: n.ilce.il, yaka: n.ilce.yaka || null, tonaj: n.tonaj })) }],
    });
    plan.kamyonlar = plan.kamyonlar.filter(x => x.no !== kno);
    if (plan.kamyonlar.length === 0) S.p_bekleme.splice(pi, 1);
    S.pGecmis = await pGetir();
    if (!S.p_bekleme.length) S.at.p = 'gecmis';
    showToast('Araç kaydedildi!');
  } catch (e) { showToast('Hata: ' + e.message, false); }
  finally { S.saving = false; render(); }
};
window.PBS = pi => { if (!confirm('Bu planı iptal etmek istediğinize emin misiniz?')) return; S.p_bekleme.splice(pi, 1); render(); };
window.PSil = async id => {
  if (!confirm('Bu planı silmek istediğinize emin misiniz?')) return;
  await pSil2(id); S.pGecmis = await pGetir(); render();
};
