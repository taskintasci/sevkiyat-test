import { S, render, showToast } from '../state.js';
import { musteriKaydet, musteriSil, musteriGetir, musteriTopluKaydet } from '../firebase.js';
import { ILLER } from '../data.js';

export function rMusteriler(S_param) {
  const localS = S_param || S;

  const ilOpts = ILLER.map(il => `<option value="${il.ad}"${localS._mIl === il.ad ? ' selected' : ''}>${il.ad}</option>`).join('');
  const secilenIl = localS._mIl || '';
  const ilceler = secilenIl ? (ILLER.find(x => x.ad === secilenIl) || { ilceler: [] }).ilceler : [];
  const ilceOpts = ilceler.map(i => `<option value="${i}">${i}</option>`).join('');

  const musteriCards = localS.musteriler.map(m => {
    const mSev = localS.saGecmis.filter(s => s.musteri === m.ad);
    const mTop = mSev.reduce((a, s) => a + (s.fiyat || 0), 0);
    const inisyal = m.ad.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style="background:#8B5CF6">${inisyal}</div>
          <div class="min-w-0">
            <div class="text-sm font-semibold text-on-surface truncate">${m.ad}</div>
            ${m.sevk_adresi ? `<div class="text-xs text-on-surface-variant mt-0.5 truncate">${m.sevk_adresi}</div>` : ''}
            ${(m.il || m.ilce) ? `<div class="text-xs text-on-surface-variant mt-0.5">📍 ${[m.il, m.ilce].filter(Boolean).join(' / ')}</div>` : ''}
          </div>
        </div>
        <button onclick="MusteriSil('${m.id}')" class="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors flex-shrink-0">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      <div class="flex gap-3 pt-3 border-t border-outline-variant">
        <div class="flex-1 text-center">
          <div class="text-xl font-bold text-on-surface">${mSev.length}</div>
          <div class="text-xs text-on-surface-variant">sevkiyat</div>
        </div>
        <div class="w-px bg-outline-variant"></div>
        <div class="flex-2 text-center flex-1">
          <div class="text-xl font-bold" style="color:#10B981">${mTop.toLocaleString('tr-TR')} ₺</div>
          <div class="text-xs text-on-surface-variant">toplam harcama</div>
        </div>
      </div>
      ${mSev.length > 0 ? `<div class="flex flex-wrap gap-1 mt-3">
        ${mSev.slice(0, 3).map(s => `<span class="text-xs bg-surface-container-low text-on-surface-variant rounded-full px-2 py-0.5">→ ${s.varis_il}/${s.varis_ilce}</span>`).join('')}
        ${mSev.length > 3 ? `<span class="text-xs text-on-surface-variant py-0.5">+${mSev.length - 3}</span>` : ''}
      </div>` : ''}
    </div>`;
  }).join('');

  return `<div class="space-y-4">
    <!-- Excel Yükleme -->
    <div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Excel ile Toplu Yükle</div>
      <div onclick="document.getElementById('musXlsx').click()"
           ondragover="event.preventDefault();this.classList.add('ring-2','ring-primary')"
           ondragleave="this.classList.remove('ring-2','ring-primary')"
           ondrop="MusteriDrop(event)"
           class="border-2 border-dashed border-outline-variant rounded-2xl p-8 text-center cursor-pointer hover:border-primary hover:bg-surface-container-low transition-all">
        <input type="file" id="musXlsx" accept=".xlsx,.xls" class="hidden" onchange="MusteriExcel(this)"/>
        <span class="material-symbols-outlined text-[36px] text-on-surface-variant mb-2 block">upload_file</span>
        <div class="text-sm text-on-surface">Excel dosyasını <strong>sürükle & bırak</strong> ya da tıkla</div>
        <div class="text-xs text-on-surface-variant mt-1">4 sütun: <strong>Firma</strong> · <strong>Sevk Adresi</strong> · <strong>İl</strong> · <strong>İlçe</strong></div>
      </div>
      <button onclick="MusteriOrnekIndir()" class="mt-3 flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm text-on-surface hover:bg-surface-container-low transition-colors">
        <span class="material-symbols-outlined text-[18px]">download</span>
        Örnek Excel Şablonu İndir
      </button>
    </div>

    <!-- Manuel Ekleme -->
    <div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Manuel Ekle</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <input id="mus_ad" type="text" placeholder="Firma adı" onkeydown="if(event.key==='Enter')MusteriEkle()"
          class="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary lg:col-span-2"/>
        <input id="mus_adres" type="text" placeholder="Sevk adresi" onkeydown="if(event.key==='Enter')MusteriEkle()"
          class="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary lg:col-span-1"/>
        <select id="mus_il" onchange="MIL(this.value)"
          class="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">— İl —</option>${ilOpts}
        </select>
        <select id="mus_ilce" ${secilenIl ? '' : 'disabled'}
          class="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
          <option value="">— İlçe —</option>${ilceOpts}
        </select>
      </div>
      <button onclick="MusteriEkle()" class="mt-3 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
        + Ekle
      </button>
    </div>

    <!-- Liste -->
    <div>
      <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Kayıtlı Müşteriler (${localS.musteriler.length})</div>
      ${localS.musteriler.length === 0
        ? `<div class="flex flex-col items-center justify-center h-48 text-center text-on-surface-variant bg-surface border border-outline-variant rounded-2xl">
            <span class="material-symbols-outlined text-[40px] mb-2" style="color:#c6c6cd">groups</span>
            <div class="text-sm font-medium">Henüz müşteri kaydı yok</div>
            <div class="text-xs mt-1">Excel yükleyin veya manuel ekleyin</div>
          </div>`
        : `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${musteriCards}</div>`
      }
    </div>
  </div>`;
}

// ── Müşteri handlers ──
window.MIL = v => {
  S._mIl = v; render();
  setTimeout(() => { const el = document.getElementById('mus_il'); if (el) el.value = v; }, 0);
};
window.MusteriEkle = async () => {
  const ad = (document.getElementById('mus_ad')?.value || '').trim();
  const sevk_adresi = (document.getElementById('mus_adres')?.value || '').trim();
  const il = document.getElementById('mus_il')?.value || '';
  const ilce = document.getElementById('mus_ilce')?.value || '';
  if (!ad) { showToast('Firma adı girin!', false); return; }
  if (S.musteriler.find(m => m.ad === ad)) { showToast('Bu müşteri zaten kayıtlı!', false); return; }
  try {
    await musteriKaydet({ ad, sevk_adresi, il, ilce });
    S.musteriler = await musteriGetir();
    S._mIl = '';
    showToast('Müşteri eklendi!');
  } catch (e) { showToast('Hata: ' + e.message, false); }
  render();
};
window.MusteriSil = async id => {
  if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
  await musteriSil(id); S.musteriler = await musteriGetir(); render();
};
window.MusteriExcel = async input => {
  const file = input.files[0]; if (!file) return;
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    let headerRow = -1;
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const r = raw[i].map(c => String(c).toLowerCase());
      if (r.some(c => c.includes('must') || c.includes('cari') || c.includes('firma') || c.includes('ad'))) { headerRow = i; break; }
    }
    const start = headerRow >= 0 ? headerRow + 1 : 1;
    const rows = [];
    for (let i = start; i < raw.length; i++) {
      const r = raw[i];
      if (!r[0] || String(r[0]).trim() === '') continue;
      rows.push({ ad: String(r[0] || '').trim(), sevk_adresi: String(r[1] || '').trim(), il: String(r[2] || '').trim(), ilce: String(r[3] || '').trim() });
    }
    if (!rows.length) { showToast('Geçerli veri bulunamadı.', false); return; }
    if (!confirm(rows.length + ' müşteri bulundu. Firebase\'e yüklensin mi?')) return;
    await musteriTopluKaydet(rows);
    S.musteriler = await musteriGetir();
    showToast(rows.length + ' müşteri yüklendi!'); render();
  } catch (e) { showToast('Hata: ' + e.message, false); }
  input.value = '';
};
window.MusteriDrop = async e => {
  e.preventDefault();
  e.target.classList.remove('ring-2', 'ring-primary');
  const file = e.dataTransfer.files[0]; if (!file) return;
  await MusteriExcel({ files: [file] });
};
window.MusteriOrnekIndir = () => {
  const wb = XLSX.utils.book_new();
  const data = [
    ['Firma', 'Sevk Adresi', 'İl', 'İlçe'],
    ['Akkim Kimya A.Ş.', 'Organize Sanayi Bölgesi No:5', 'Yalova', 'Merkez'],
    ['Marmara İnşaat Ltd.', 'Bağcılar Mah. Sanayi Cad. No:12', 'İstanbul', 'Kadıköy'],
    ['Ege Gıda San. Tic.', 'Atatürk OSB 3. Cadde No:8', 'İzmir', 'Konak'],
    ['Bosphorus Lojistik', 'Dudullu OSB 1. Sok. No:4', 'İstanbul', 'Pendik'],
    ['Anadolu Çelik Boru', 'Gebze OSB 100. Yıl Bulvarı No:22', 'Kocaeli', 'Gebze'],
    ['Trakya Tekstil A.Ş.', 'Çorlu OSB Plastik Cad. No:7', 'Tekirdağ', 'Çorlu'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 28 }, { wch: 36 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Musteriler');
  XLSX.writeFile(wb, 'ornek_musteri_listesi.xlsx');
  showToast('Şablon indirildi!');
};
