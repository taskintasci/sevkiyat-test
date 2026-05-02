import { ExcelRapor } from '../excel.js';

function pb(pct, renk) {
  return `<div class="h-1.5 bg-surface-variant rounded-full overflow-hidden my-1"><div class="h-full rounded-full" style="width:${Math.min(pct,100)}%;background:${renk}"></div></div>`;
}

export function rDashboard(S) {
  // ── Filtre uygula ──
  const sa = S.saGecmis.filter(s => {
    if (S.dash_durum && s.durum !== S.dash_durum) return false;
    if (S.dash_search) {
      const q = S.dash_search.toLowerCase();
      if (!((s.varis_il || '').toLowerCase().includes(q) ||
            (s.varis_ilce || '').toLowerCase().includes(q) ||
            (s.firma_ad || '').toLowerCase().includes(q) ||
            (s.musteri || '').toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const p = S.pGecmis;
  const filtreli = S.dash_search || S.dash_durum;

  const buAy = new Date(); buAy.setDate(1); buAy.setHours(0,0,0,0);
  const saAy = sa.filter(s => s.tarih && (s.tarih.toDate ? s.tarih.toDate() : new Date(s.tarih)) >= buAy);
  const toplamFiyat = sa.reduce((a, s) => a + (s.fiyat || 0), 0);
  const toplamTon   = sa.reduce((a, s) => a + (s.toplam_ton || s.tonaj || 0), 0);
  const toplamPTon  = p.reduce((a, x) => a + (x.toplam_ton || 0), 0);

  const durumSay = {};
  sa.forEach(s => { const d = s.durum || "Planlandı"; durumSay[d] = (durumSay[d] || 0) + 1; });

  const firmaMap = {};
  sa.forEach(s => {
    if (!s.firma_ad) return;
    if (!firmaMap[s.firma_ad]) firmaMap[s.firma_ad] = { ad: s.firma_ad, sayi: 0, toplam: 0 };
    firmaMap[s.firma_ad].sayi++; firmaMap[s.firma_ad].toplam += (s.fiyat || 0);
  });
  const firmaList = Object.values(firmaMap).sort((a, b) => b.sayi - a.sayi).slice(0, 5);

  const musteriMap = {};
  sa.forEach(s => {
    if (!s.musteri) return;
    if (!musteriMap[s.musteri]) musteriMap[s.musteri] = { ad: s.musteri, sayi: 0, toplam: 0 };
    musteriMap[s.musteri].sayi++; musteriMap[s.musteri].toplam += (s.fiyat || 0);
  });
  const musteriList = Object.values(musteriMap).sort((a, b) => b.toplam - a.toplam).slice(0, 5);

  const ayMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    ayMap[k] = 0;
  }
  sa.forEach(s => {
    if (!s.tarih) return;
    const d = s.tarih.toDate ? s.tarih.toDate() : new Date(s.tarih);
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    if (ayMap[k] !== undefined) ayMap[k] += (s.fiyat || 0);
  });
  const aylar = Object.entries(ayMap);
  const maxAy = Math.max(...aylar.map(a => a[1]), 1);

  const durumRenkler = { "Planlandı":"#64748b", "Yüklendi":"#3B82F6", "Yolda":"#F59E0B", "Teslim Edildi":"#10B981", "İptal":"#EF4444" };

  const kartlar = [
    { lbl: "Toplam Sevkiyat",  val: sa.length,                                   sub: filtreli ? "filtreli sonuç" : "tüm zamanlar",   icon: "route",          renk: "#3B82F6" },
    { lbl: "Bu Ay Sevkiyat",   val: saAy.length,                                  sub: "bu ay",          icon: "calendar_month", renk: "#F59E0B" },
    { lbl: "Toplam Harcama",   val: toplamFiyat.toLocaleString("tr-TR") + " ₺",  sub: "şehirler arası", icon: "payments",       renk: "#10B981" },
    { lbl: "Toplam Yük",       val: (toplamTon + (filtreli ? 0 : toplamPTon)).toFixed(1) + " t", sub: filtreli ? "SA sevkiyat" : "SA + Parsiyel", icon: "inventory_2", renk: "#8B5CF6" },
  ];

  // ── Filtre barı ──
  let h = `<div class="flex items-center gap-3 mb-6 flex-wrap">
    <div class="relative flex-1 min-w-52">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
      <input type="text" placeholder="İl, ilçe, firma veya müşteri ara..." value="${S.dash_search}"
        oninput="DS(this.value)"
        class="w-full pl-9 pr-3 py-2 text-sm border border-outline-variant rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"/>
    </div>
    <select onchange="DD(this.value)"
      class="border border-outline-variant rounded-xl px-3 py-2 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
      <option value="">Tüm Durumlar</option>
      ${['Planlandı','Yüklendi','Yolda','Teslim Edildi','İptal'].map(d => `<option value="${d}"${S.dash_durum===d?' selected':''}>${d}</option>`).join('')}
    </select>
    ${filtreli ? `
      <button onclick="DFTemizle()" class="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors whitespace-nowrap">
        <span class="material-symbols-outlined text-[14px]">close</span>Filtreyi Temizle
      </button>
      <span class="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full whitespace-nowrap">${sa.length} / ${S.saGecmis.length} kayıt</span>
    ` : ''}
  </div>`;

  // ── Stat kartları ──
  h += `<div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">`;
  kartlar.forEach(c => {
    h += `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:${c.renk}20">
          <span class="material-symbols-outlined text-[20px]" style="color:${c.renk}">${c.icon}</span>
        </div>
      </div>
      <div class="text-2xl font-bold text-on-surface mb-0.5">${c.val}</div>
      <div class="text-xs text-on-surface-variant font-medium uppercase tracking-wide">${c.lbl}</div>
      <div class="text-xs text-on-surface-variant mt-1">${c.sub}</div>
    </div>`;
  });
  h += `</div>`;

  h += `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">`;

  // Aylık trend
  h += `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
    <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Aylık Harcama Trendi (Son 6 Ay)</div>
    <div class="flex items-end gap-2 h-28">`;
  aylar.forEach(([ay, val]) => {
    const pct = Math.round((val / maxAy) * 100);
    const tarih = new Date(ay + "-01");
    const ayAd = tarih.toLocaleString("tr-TR", { month: "short" });
    h += `<div class="flex-1 flex flex-col items-center gap-1 h-full">
      <div class="text-[10px] text-on-surface-variant">${val > 0 ? Math.round(val / 1000) + "K" : ""}</div>
      <div class="flex-1 w-full flex items-end">
        <div class="w-full rounded-t" style="height:${Math.max(pct, 4)}%;background:${pct > 0 ? "#3B82F6" : "rgb(var(--c-surface-variant))"}"></div>
      </div>
      <div class="text-[10px] text-on-surface-variant">${ayAd}</div>
    </div>`;
  });
  h += `</div></div>`;

  // Durum dağılımı
  h += `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
    <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Sevkiyat Durum Dağılımı</div>`;
  Object.keys(durumRenkler).forEach(d => {
    const sayi = durumSay[d] || 0;
    const pct = sa.length > 0 ? Math.round((sayi / sa.length) * 100) : 0;
    h += `<div class="mb-3">
      <div class="flex justify-between mb-1">
        <span class="text-xs font-medium" style="color:${durumRenkler[d]}">${d}</span>
        <span class="text-xs text-on-surface-variant">${sayi} (${pct}%)</span>
      </div>
      ${pb(pct, durumRenkler[d])}
    </div>`;
  });
  h += `</div></div>`;

  // Firma + Müşteri
  h += `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
  h += `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
    <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Firma Performansı</div>`;
  if (!firmaList.length) h += `<p class="text-sm text-on-surface-variant text-center py-6">Henüz veri yok</p>`;
  firmaList.forEach((f, i) => {
    h += `<div class="flex items-center gap-3 py-2.5 border-b border-outline-variant last:border-0">
      <div class="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">${i + 1}</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-on-surface truncate">${f.ad}</div>
        <div class="text-xs text-on-surface-variant">${f.sayi} sevkiyat</div>
      </div>
      <div class="text-sm font-semibold flex-shrink-0" style="color:#10B981">${f.toplam.toLocaleString("tr-TR")} ₺</div>
    </div>`;
  });
  h += `</div>`;

  h += `<div class="bg-surface border border-outline-variant rounded-2xl p-5">
    <div class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-4">Müşteri Analizi</div>`;
  if (!musteriList.length) h += `<p class="text-sm text-on-surface-variant text-center py-6">Müşteri atanmış sevkiyat yok</p>`;
  musteriList.forEach((m, i) => {
    const inisyal = m.ad.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    h += `<div class="flex items-center gap-3 py-2.5 border-b border-outline-variant last:border-0">
      <div class="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center text-[11px] font-bold flex-shrink-0" style="color:#8B5CF6">${inisyal}</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-on-surface truncate">${m.ad}</div>
        <div class="text-xs text-on-surface-variant">${m.sayi} sevkiyat</div>
      </div>
      <div class="text-sm font-semibold flex-shrink-0" style="color:#8B5CF6">${m.toplam.toLocaleString("tr-TR")} ₺</div>
    </div>`;
  });
  h += `</div></div>`;

  h += `<div class="mt-4 flex justify-end">
    <button onclick="ExcelRapor()" class="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm text-on-surface hover:bg-surface-container-low transition-colors">
      <span class="material-symbols-outlined text-[18px]">download</span>
      Tüm Sevkiyatları Excel Olarak İndir
    </button>
  </div>`;

  return h;
}

window.ExcelRapor = () => {
  import('../state.js').then(m => ExcelRapor(m.S));
};
