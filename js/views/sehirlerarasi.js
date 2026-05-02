import { S, render, showToast } from '../state.js';
import { saGetir, saKaydet, saSil2, durumGuncelle } from '../firebase.js';
import { ILLER } from '../data.js';
import { tonajiBol, aracTipi, fmtTarih } from '../algorithms.js';
import { ab, pb, guzSA, piInput, acBox, statusBadge } from '../components/ui.js';

function tabBtn(key, label, active, badge) {
  return `<button onclick="SAT('${key}')"
    class="px-4 py-2 text-sm font-medium rounded-lg transition-all ${active
      ? 'bg-primary text-on-primary'
      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}">
    ${label}${badge ? ` <span class="ml-1 bg-error text-on-error text-xs rounded-full px-1.5 py-0.5">${badge}</span>` : ''}
  </button>`;
}

function onizHTML(ton) {
  if (!(ton > 0)) return `<p class="text-xs text-on-surface-variant text-center py-2">Tonaj girin → araç tipi hesaplanır</p>`;
  const araclar = tonajiBol(ton);
  let h = '';
  araclar.forEach((a, i) => {
    const pct = Math.round((a.yukTon / a.max) * 100);
    h += `<div class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-2">
        <span class="text-xs text-on-surface-variant">${i + 1}.</span>${ab(a)}
      </div>
      <span class="text-xs font-semibold" style="color:${a.renk}">${a.yukTon.toFixed(1)} / ${a.max} t</span>
    </div>${pb(pct, a.renk)}`;
  });
  h += `<p class="text-xs text-on-surface-variant mt-1">Toplam ${ton.toFixed(1)} ton → ${araclar.length} araç</p>`;
  return h;
}

function rSAYeni() {
  const il = S.sa_il ? ILLER.find(x => x.ad === S.sa_il) : null;
  const ilceler = il ? il.ilceler : [];
  const key = S.sa_il && S.sa_ilce ? S.sa_il + '__' + S.sa_ilce : null;
  const kars = key
    ? S.firmalar.filter(f => f.fiyatlar && f.fiyatlar[key] !== undefined)
        .map(f => ({ firma: f, fiyat: f.fiyatlar[key] }))
        .sort((a, b) => a.fiyat - b.fiyat)
    : [];
  const ton = parseFloat(S.sa_tonaj) || 0;

  const ilOpts = `<option value="">— İl seçin —</option>` +
    ILLER.map(x => `<option value="${x.ad}"${S.sa_il === x.ad ? ' selected' : ''}>${x.ad}</option>`).join('');
  const ilceOpts = `<option value="">— İlçe seçin —</option>` +
    ilceler.map(x => `<option value="${x}"${S.sa_ilce === x ? ' selected' : ''}>${x}</option>`).join('');

  let sagHTML = '';
  if (!S.sa_ilce) {
    sagHTML = `<div class="flex flex-col items-center justify-center h-48 text-on-surface-variant">
      <span class="material-symbols-outlined text-4xl mb-2">local_shipping</span>
      <p class="text-sm">Varış noktası seçin</p>
      <p class="text-xs mt-1">Fiyat karşılaştırması burada görünecek</p>
    </div>`;
  } else if (!kars.length) {
    sagHTML = `<div class="flex flex-col items-center justify-center h-48 text-on-surface-variant">
      <span class="material-symbols-outlined text-4xl mb-2">warning</span>
      <p class="text-sm font-medium text-on-surface">${S.sa_il} / ${S.sa_ilce}</p>
      <p class="text-xs mt-1">Bu güzergah için fiyat bulunamadı</p>
    </div>`;
  } else {
    sagHTML = `<p class="text-xs text-on-surface-variant mb-3">${S.sa_il} / ${S.sa_ilce} için <strong class="text-on-surface">${kars.length}</strong> firma</p>`;
    kars.forEach(({ firma, fiyat }, idx) => {
      const top = idx === 0;
      const sel = S.sa_firma && S.sa_firma.id === firma.id;
      sagHTML += `<div onclick="SAFT('${firma.id}')"
        class="flex items-center justify-between p-3 rounded-xl border mb-2 cursor-pointer transition-all
          ${sel ? 'border-primary ring-1 ring-primary bg-primary-fixed/20' : top ? 'border-secondary bg-secondary-fixed/10' : 'border-outline-variant hover:border-outline bg-surface-container-lowest'}">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
            ${top ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'}">${idx + 1}</div>
          <div class="min-w-0">
            <div class="text-sm font-medium text-on-surface">${firma.ad}${top ? ' ⭐' : ''}</div>
            ${firma.iletisim ? `<div class="text-xs text-on-surface-variant">📞 ${firma.iletisim}</div>` : ''}
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-base font-bold ${top ? 'text-secondary' : 'text-on-surface'}">${fiyat.toLocaleString('tr-TR')} ₺</div>
          ${idx > 0 ? `<div class="text-xs text-error">+${(fiyat - kars[0].fiyat).toLocaleString('tr-TR')} ₺</div>` : ''}
        </div>
      </div>`;
    });
    if (S.sa_firma) {
      sagHTML += `<button onclick="SAPGonder()" ${S.saving ? 'disabled' : ''}
        class="w-full mt-3 bg-primary text-on-primary py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
        <span class="material-symbols-outlined text-[18px]">directions_car</span>
        Plaka Girişine Gönder
      </button>`;
    }
  }

  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="flex flex-col gap-4">
      <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
        <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Kalkış Noktası</p>
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-secondary">location_on</span>
          <div>
            <div class="text-lg font-bold text-on-surface">Yalova</div>
            <div class="text-xs text-on-surface-variant">Sabit kalkış noktası</div>
          </div>
        </div>
      </div>
      <div>
        <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Müşteri / Cari</label>
        <select onchange="SAMUS(this.value)" class="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">— Müşteri seçin (opsiyonel) —</option>
          ${S.musteriler.map(m => `<option value="${m.ad}"${S.sa_musteri === m.ad ? ' selected' : ''}>${m.ad}${m.il ? ' — ' + m.il + (m.ilce ? ' / ' + m.ilce : '') : ''}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Varış İli</label>
        <select onchange="SAIL(this.value)" class="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary">${ilOpts}</select>
      </div>
      <div>
        <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Varış İlçesi</label>
        <select ${S.sa_il ? '' : 'disabled'} onchange="SAILCE(this.value)" class="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40">${ilceOpts}</select>
      </div>
      <div>
        <label class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Yükün Tonajı</label>
        <input id="sa_ton" type="number" min="0.1" step="0.1" placeholder="Toplam ton girin..."
          value="${S.sa_tonaj}" oninput="SATON(this.value)"
          class="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface-container-lowest focus:outline-none focus:ring-1 focus:ring-primary mb-2"/>
        <div id="sa-oniz" class="bg-surface-container-low rounded-xl p-3">${onizHTML(ton)}</div>
      </div>
    </div>
    <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">${sagHTML}</div>
  </div>`;
}

function rSAPlaka() {
  if (!S.sa_bekleme.length) return `<div class="flex flex-col items-center justify-center py-16 text-on-surface-variant">
    <span class="material-symbols-outlined text-5xl mb-3">directions_car</span>
    <p class="text-sm">Bekleyen sevkiyat yok</p>
    <p class="text-xs mt-1">Yeni Sevkiyat sekmesinden oluşturun</p>
  </div>`;

  let h = '<div class="flex flex-col gap-4">';
  S.sa_bekleme.forEach((b, bi) => {
    const musteriRec = b.musteri ? S.musteriler.find(m => m.ad === b.musteri) : null;
    const sevkAdresi = musteriRec?.sevk_adresi || '';
    h += `<div class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
      <div class="flex items-start justify-between mb-3 pb-3 border-b border-outline-variant">
        <div>
          <div class="text-base font-semibold text-on-surface">Yalova → ${b.il} / ${b.ilce}</div>
          <div class="text-xs text-on-surface-variant mt-0.5">🚚 ${b.firma.ad}${b.firma.iletisim ? ' · 📞 ' + b.firma.iletisim : ''} · ${b.fiyat.toLocaleString('tr-TR')} ₺</div>
          <div class="text-xs text-on-surface-variant">${b.toplamTon.toFixed(1)} ton · ${b.araclar.length} araç</div>
        </div>
        <button onclick="SABS(${bi})" class="text-on-surface-variant hover:text-error transition-colors p-1">
          <span class="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
      ${b.musteri ? `<div class="bg-surface-container-low rounded-xl px-3 py-2 mb-3 flex items-center gap-2 flex-wrap">
        <span class="text-sm font-semibold" style="color:#8B5CF6">🏢 ${b.musteri}</span>
        ${sevkAdresi ? `<span class="text-xs text-on-surface-variant">📌 ${sevkAdresi}</span>` : ''}
      </div>` : ''}`;

    b.araclar.forEach((a, ai) => {
      const pct = Math.round((a.yukTon / a.max) * 100);
      const plakaTamam = (a.plaka || '').trim().length >= 3;
      h += `<div class="border-l-4 pl-3 mb-3" style="border-color:${a.renk}">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
          <div class="flex items-center gap-2 flex-wrap">
            ${ab(a)}
            <span class="text-sm font-medium text-on-surface">${a.no}. Araç</span>
            <span class="text-xs text-on-surface-variant">${a.yukTon.toFixed(1)} / ${a.max} ton · ${pct}% dolu</span>
          </div>
          ${piInput(`sap-${bi}-${ai}`, a.plaka, `SAP(${bi},${ai},this.value)`)}
        </div>
        ${pb(pct, a.renk)}
        ${guzSA(b.ilce, b.il, a.renk)}
        ${acBox(`saa-${bi}-${ai}`, a.aciklama, `SAA(${bi},${ai},this.value)`)}
        <button id="sabtn-${bi}-${ai}" onclick="SAPK(${bi},${ai})" ${!plakaTamam || S.saving ? 'disabled' : ''}
          class="mt-2 w-full bg-primary text-on-primary py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[16px]">save</span>
          ${S.saving ? 'Kaydediliyor...' : plakaTamam ? 'Bu Aracı Kaydet' : 'Plaka Girin'}
        </button>
      </div>`;
    });
    h += '</div>';
  });
  return h + '</div>';
}

function rSAGecmis() {
  if (!S.saGecmis.length) return `<div class="flex flex-col items-center justify-center py-16 text-on-surface-variant">
    <span class="material-symbols-outlined text-5xl mb-3">receipt_long</span>
    <p class="text-sm">Henüz sevkiyat kaydı yok</p>
  </div>`;

  const durumOpts = ['Planlandı', 'Yüklendi', 'Yolda', 'Teslim Edildi', 'İptal'];

  let h = `<div class="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
    <div class="overflow-x-auto custom-scrollbar">
    <table class="w-full text-sm">
      <thead class="bg-surface-container-low">
        <tr>
          <th class="w-8 px-3 py-3"></th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Tarih</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Güzergah</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Firma</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Plaka(lar)</th>
          <th class="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Tonaj</th>
          <th class="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Fiyat</th>
          <th class="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Durum</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-outline-variant">`;

  S.saGecmis.forEach(s => {
    const top = s.toplam_ton || s.tonaj || 0;
    const durum = s.durum || 'Planlandı';
    const araclar = s.araclar || [];
    const plakalar = araclar.map(a => a.plaka).filter(Boolean).join(', ');
    const expanded = S.sa_expand === s.id;

    h += `<tr class="hover:bg-surface-container-low transition-colors cursor-pointer" onclick="SAExpand('${s.id}')">
      <td class="px-3 py-3 text-center">
        <span class="material-symbols-outlined text-[16px] text-on-surface-variant transition-transform ${expanded ? 'rotate-90' : ''}">chevron_right</span>
      </td>
      <td class="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">${fmtTarih(s.tarih)}</td>
      <td class="px-4 py-3">
        <div class="text-sm font-medium text-on-surface">${s.varis_il} / ${s.varis_ilce}</div>
        ${s.musteri ? `<div class="text-xs text-on-surface-variant">👤 ${s.musteri}</div>` : ''}
      </td>
      <td class="px-4 py-3 text-sm text-on-surface">${s.firma_ad || '—'}</td>
      <td class="px-4 py-3 text-xs font-mono text-on-surface-variant">${plakalar || '—'}</td>
      <td class="px-4 py-3 text-right text-sm text-on-surface">${top.toFixed(1)} t</td>
      <td class="px-4 py-3 text-right text-sm font-semibold text-secondary">${(s.fiyat || 0).toLocaleString('tr-TR')} ₺</td>
      <td class="px-4 py-3" onclick="event.stopPropagation()">
        <select onchange="SADurum('${s.id}',this.value)"
          class="text-xs border border-outline-variant rounded-lg px-2 py-1 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
          ${durumOpts.map(d => `<option value="${d}"${durum === d ? ' selected' : ''}>${d}</option>`).join('')}
        </select>
      </td>
      <td class="px-4 py-3" onclick="event.stopPropagation()">
        <button onclick="SASil('${s.id}')" class="text-on-surface-variant hover:text-error transition-colors p-1">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </td>
    </tr>`;

    if (expanded) {
      h += `<tr>
        <td colspan="9" class="px-4 py-4 bg-surface-container-low border-b border-outline-variant">
          <div class="flex flex-wrap gap-3">
            ${araclar.map(a => `
              <div class="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant min-w-48">
                <div class="text-xl">${a.icon || '🚚'}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-xs font-semibold px-1.5 py-0.5 rounded-full" style="background:${a.renk}20;color:${a.renk}">${a.tip || 'Araç'}</span>
                    ${a.plaka ? `<span class="text-xs font-mono font-bold text-on-surface tracking-widest">${a.plaka}</span>` : '<span class="text-xs text-on-surface-variant italic">Plaka yok</span>'}
                  </div>
                  <div class="text-xs text-on-surface-variant">${(a.yukTon || 0).toFixed(1)} / ${a.max || 24} ton</div>
                  ${a.aciklama ? `<div class="text-xs text-on-surface-variant mt-1 italic">"${a.aciklama}"</div>` : ''}
                </div>
              </div>`).join('')}
            ${s.musteri ? `
              <div class="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant">
                <span class="material-symbols-outlined text-[20px]" style="color:#8B5CF6">person</span>
                <div>
                  <div class="text-xs font-semibold" style="color:#8B5CF6">${s.musteri}</div>
                  <div class="text-xs text-on-surface-variant">Müşteri</div>
                </div>
              </div>` : ''}
            ${s.firma_iletisim ? `
              <div class="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant">
                <span class="material-symbols-outlined text-[20px] text-on-surface-variant">call</span>
                <div>
                  <div class="text-xs font-semibold text-on-surface">${s.firma_iletisim}</div>
                  <div class="text-xs text-on-surface-variant">${s.firma_ad}</div>
                </div>
              </div>` : ''}
          </div>
        </td>
      </tr>`;
    }
  });

  h += `</tbody></table></div></div>`;
  return h;
}

export function rSA(S) {
  const at = S.at.sa;
  const tabs = `<div class="flex gap-2 mb-6">
    ${tabBtn('yeni', '+ Yeni Sevkiyat', at === 'yeni', 0)}
    ${tabBtn('plaka', '🚘 Plaka Bekleme', at === 'plaka', S.sa_bekleme.length)}
    ${tabBtn('gecmis', `Geçmiş (${S.saGecmis.length})`, at === 'gecmis', 0)}
  </div>`;
  return tabs + (at === 'yeni' ? rSAYeni() : at === 'plaka' ? rSAPlaka() : rSAGecmis());
}

// ── HANDLERS ──
window.SAT = t => { S.at.sa = t; render(); };
window.SAIL = v => { S.sa_il = v; S.sa_ilce = ''; S.sa_firma = null; render(); };
window.SAILCE = v => { S.sa_ilce = v; S.sa_firma = null; render(); };
window.SATON = v => {
  S.sa_tonaj = v;
  const ton = parseFloat(v) || 0;
  const el = document.getElementById('sa-oniz');
  if (el) el.innerHTML = onizHTML(ton);
};
window.SAFT = id => {
  const f = S.firmalar.find(x => x.id === id);
  S.sa_firma = S.sa_firma && S.sa_firma.id === id ? null : f;
  render();
};
window.SAMUS = v => {
  S.sa_musteri = v;
  if (v) {
    const m = S.musteriler.find(x => x.ad === v);
    if (m && m.il) { S.sa_il = m.il; S.sa_ilce = m.ilce || ''; S.sa_firma = null; }
  }
  render();
};
window.SAPGonder = () => {
  if (!S.sa_firma || !S.sa_il || !S.sa_ilce) return;
  const inp = document.getElementById('sa_ton');
  const ton = parseFloat(inp ? inp.value : S.sa_tonaj) || 0;
  if (ton <= 0) { showToast('Lütfen tonaj girin!', false); return; }
  S.sa_tonaj = String(ton);
  const al = tonajiBol(ton).map((a, i) => ({ ...a, no: i + 1, plaka: '', aciklama: '' }));
  S.sa_bekleme.push({ il: S.sa_il, ilce: S.sa_ilce, firma: S.sa_firma, fiyat: S.sa_firma.fiyatlar[S.sa_il + '__' + S.sa_ilce], toplamTon: ton, musteri: S.sa_musteri, araclar: al });
  S.sa_il = ''; S.sa_ilce = ''; S.sa_firma = null; S.sa_tonaj = ''; S.sa_musteri = ''; S.at.sa = 'plaka';
  render();
};
window.SAP = (bi, ai, val) => {
  S.sa_bekleme[bi].araclar[ai].plaka = val.toUpperCase();
  const ok = val.trim().length >= 3;
  const inp = document.getElementById(`sap-${bi}-${ai}`); if (inp) inp.classList.toggle('ok', ok);
  const chk = document.getElementById(`sap-${bi}-${ai}-c`); if (chk) { chk.textContent = ok ? '✓' : 'Plaka'; }
  const btn = document.getElementById(`sabtn-${bi}-${ai}`); if (btn) { btn.disabled = !ok; btn.textContent = ok ? '💾 Bu Aracı Kaydet' : 'Plaka Girin'; }
};
window.SAA = (bi, ai, val) => { S.sa_bekleme[bi].araclar[ai].aciklama = val; };
window.SAPK = async (bi, ai) => {
  const b = S.sa_bekleme[bi]; if (!b) return;
  const a = b.araclar[ai]; if (!a) return;
  S.saving = true; render();
  try {
    await saKaydet({ kalkis: 'Yalova', varis_il: b.il, varis_ilce: b.ilce, firma_ad: b.firma.ad, firma_iletisim: b.firma.iletisim || '',
      fiyat: b.fiyat, toplam_ton: b.toplamTon, musteri: b.musteri || '', durum: 'Planlandı',
      araclar: [{ no: a.no, tip: a.tip, icon: a.icon, renk: a.renk, max: a.max, yukTon: a.yukTon, plaka: a.plaka, aciklama: a.aciklama || '' }] });
    b.araclar.splice(ai, 1);
    if (b.araclar.length === 0) S.sa_bekleme.splice(bi, 1);
    S.saGecmis = await saGetir();
    if (!S.sa_bekleme.length) S.at.sa = 'gecmis';
    showToast('✅ Araç kaydedildi!');
  } catch (e) { showToast('❌ Hata: ' + e.message, false); }
  finally { S.saving = false; render(); }
};
window.SABS = bi => { if (!confirm('Bu sevkiyatı iptal etmek istediğinize emin misiniz?')) return; S.sa_bekleme.splice(bi, 1); render(); };
window.SASil = async id => { if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return; await saSil2(id); S.saGecmis = await saGetir(); render(); };
window.SADurum = async (id, durum) => {
  try { await durumGuncelle('sehirlerarasi_sevkiyatlar', id, durum); const rec = S.saGecmis.find(s => s.id === id); if (rec) rec.durum = durum; showToast('✅ Durum güncellendi!'); render(); }
  catch (e) { showToast('❌ Hata: ' + e.message, false); }
};
