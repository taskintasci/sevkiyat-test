import { S, render, showToast } from '../state.js';
import { fKaydet, fSil, fGetir } from '../firebase.js';
import { excelOku, rowsToFirmalar, OrnekIndir as _OrnekIndir } from '../excel.js';

export function rFirmalar(S_param) {
  const localS = S_param || S;

  const firmaCards = localS.firmalar.map(f => {
    const destSay = Object.keys(f.fiyatlar || {}).length;
    const inisyal = f.ad.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style="background:#3B82F6">${inisyal}</div>
          <div class="min-w-0">
            <div class="text-sm font-semibold text-on-surface truncate">${f.ad}</div>
            ${f.iletisim ? `<div class="text-xs text-on-surface-variant mt-0.5">${f.iletisim}</div>` : ''}
          </div>
        </div>
        <button onclick="FKaldir('${f.id}')" class="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors flex-shrink-0">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      <div class="flex items-center gap-2 pt-3 border-t border-outline-variant">
        <span class="material-symbols-outlined text-[16px] text-on-surface-variant">route</span>
        <span class="text-xs text-on-surface-variant">${destSay} destinasyon fiyatı</span>
      </div>
    </div>`;
  }).join('');

  return `<div class="space-y-4">
    <!-- Excel Yükleme -->
    <div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Excel Dosyası Yükle</div>
      <div onclick="document.getElementById('xlsxInput').click()"
           ondragover="event.preventDefault();this.classList.add('ring-2','ring-primary')"
           ondragleave="this.classList.remove('ring-2','ring-primary')"
           ondrop="DragDrop(event)"
           class="border-2 border-dashed border-outline-variant rounded-2xl p-10 text-center cursor-pointer hover:border-primary hover:bg-surface-container-low transition-all">
        <input type="file" id="xlsxInput" accept=".xlsx,.xls" class="hidden" onchange="ExcelYukle(this)"/>
        <span class="material-symbols-outlined text-[40px] text-on-surface-variant mb-3 block">upload_file</span>
        <div class="text-sm text-on-surface">Excel dosyasını <strong>sürükle & bırak</strong> ya da tıkla</div>
        <div class="text-xs text-on-surface-variant mt-1">.xlsx veya .xls · Firma Adı, İl, İlçe, Fiyat sütunları</div>
      </div>
      <button onclick="OrnekIndir()" class="mt-3 flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm text-on-surface hover:bg-surface-container-low transition-colors">
        <span class="material-symbols-outlined text-[18px]">download</span>
        Örnek Excel Şablonu İndir
      </button>
    </div>

    <!-- Firma Listesi -->
    <div>
      <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Kayıtlı Firmalar (${localS.firmalar.length})</div>
      ${localS.firmalar.length === 0
        ? `<div class="flex flex-col items-center justify-center h-48 text-center text-on-surface-variant bg-surface border border-outline-variant rounded-2xl">
            <span class="material-symbols-outlined text-[40px] mb-2" style="color:#c6c6cd">local_shipping</span>
            <div class="text-sm font-medium">Henüz firma kaydı yok</div>
            <div class="text-xs mt-1">Excel yükleyerek başlayın</div>
          </div>`
        : `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${firmaCards}</div>`
      }
    </div>
  </div>`;
}

// ── Firma handlers ──
window.ExcelYukle = async input => {
  const file = input.files[0]; if (!file) return;
  S.saving = true; render();
  try {
    const rows = await excelOku(file);
    if (!rows.length) { S.saving = false; render(); return; }
    const firmalar = rowsToFirmalar(rows);
    if (!firmalar.length) { showToast('Geçerli veri bulunamadı.', false); S.saving = false; render(); return; }
    if (!confirm(firmalar.length + ' firma, ' + rows.length + ' satır bulundu. Yüklensin mi?')) { S.saving = false; render(); return; }
    await fKaydet(firmalar);
    S.firmalar = await fGetir();
    showToast(firmalar.length + ' firma yüklendi!');
  } catch (e) { showToast('Hata: ' + e.message, false); }
  finally { S.saving = false; render(); }
  input.value = '';
};
window.DragDrop = async e => {
  e.preventDefault();
  e.target.classList.remove('ring-2', 'ring-primary');
  const file = e.dataTransfer.files[0]; if (!file) return;
  await ExcelYukle({ files: [file] });
};
window.FKaldir = async id => {
  if (!confirm('Bu firmayı silmek istediğinize emin misiniz?')) return;
  await fSil(id);
  S.firmalar = S.firmalar.filter(f => f.id !== id);
  render();
};
window.OrnekIndir = () => _OrnekIndir();
