export function renderShell(S) {
  const tabs = [
    { key: 'dashboard',     label: 'Dashboard',       icon: 'dashboard',       badge: 0,                   pending: 0 },
    { key: 'sehirlerarasi', label: 'Şehirler Arası',  icon: 'route',           badge: S.saGecmis.length,   pending: S.sa_bekleme.length },
    { key: 'parsiyel',      label: 'Parsiyel',         icon: 'inventory_2',     badge: S.pGecmis.length,    pending: S.p_bekleme.length },
    { key: 'musteriler',    label: 'Müşteriler',       icon: 'groups',          badge: S.musteriler.length, pending: 0 },
    { key: 'firmalar',      label: 'Firmalar',         icon: 'local_shipping',  badge: S.firmalar.length,   pending: 0 },
  ];

  const navItems = tabs.map(t => {
    const active = S.tab === t.key;
    const activeCls = active
      ? 'bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold'
      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border border-transparent';
    return `
      <a onclick="ST('${t.key}')" class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${activeCls}">
        <span class="material-symbols-outlined text-[20px]${active ? ' fill' : ''}">${t.icon}</span>
        <span class="text-body-sm flex-1">${t.label}</span>
        ${t.badge ? `<span class="text-label-sm bg-surface-container-high text-on-surface-variant rounded-full px-2 py-0.5">${t.badge}</span>` : ''}
        ${t.pending ? `<span class="text-label-sm bg-error text-on-error rounded-full px-2 py-0.5">${t.pending}</span>` : ''}
      </a>`;
  }).join('');

  // Mini stats for sidebar footer
  const buAy = new Date(); buAy.setDate(1); buAy.setHours(0, 0, 0, 0);
  const saAy = S.saGecmis.filter(s => {
    if (!s.tarih) return false;
    const d = s.tarih.toDate ? s.tarih.toDate() : new Date(s.tarih);
    return d >= buAy;
  });
  const buAyToplam = saAy.reduce((a, s) => a + (s.fiyat || 0), 0);
  const miniStats = (saAy.length > 0 || buAyToplam > 0) ? `
    <div class="mx-1 mt-2 px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant">
      <div class="text-label-sm text-on-surface-variant mb-1.5">Bu Ay</div>
      <div class="flex items-end justify-between">
        <div>
          <div class="text-base font-bold text-on-surface">${saAy.length}</div>
          <div class="text-label-sm text-on-surface-variant">sevkiyat</div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-secondary">${buAyToplam >= 1000 ? Math.round(buAyToplam / 1000) + 'K' : buAyToplam.toLocaleString('tr-TR')} ₺</div>
          <div class="text-label-sm text-on-surface-variant">harcama</div>
        </div>
      </div>
    </div>` : '';

  // Sidebar visibility classes
  const sidebarCls = S.sidebarOpen
    ? 'flex flex-col fixed inset-y-0 left-0 z-40 shadow-2xl'
    : 'hidden lg:flex lg:flex-col';

  return `
    ${S.sidebarOpen ? `<div onclick="CloseSidebar()" class="fixed inset-0 bg-black/50 z-30 lg:hidden"></div>` : ''}
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 flex-shrink-0 bg-surface-container-low border-r border-outline-variant ${sidebarCls}">
        <div class="p-sm border-b border-outline-variant">
          <div class="flex items-center gap-2 px-1 py-2">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-on-primary text-[18px] fill">local_shipping</span>
            </div>
            <div>
              <div class="text-label-lg text-on-surface font-bold leading-tight">SEVKİYAT</div>
              <div class="text-label-sm text-on-surface-variant tracking-widest">YÖNETİM SİSTEMİ</div>
            </div>
          </div>
        </div>
        <nav class="flex-1 p-sm flex flex-col gap-1 overflow-y-auto custom-scrollbar">
          ${navItems}
        </nav>
        <div class="p-sm border-t border-outline-variant">
          <div class="text-label-sm text-on-surface-variant px-3 py-1">
            <span class="inline-block w-2 h-2 rounded-full bg-secondary mr-1 align-middle"></span>
            Kalkış: <strong class="text-on-surface">Yalova</strong>
          </div>
          ${miniStats}
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- Topnav -->
        <nav class="bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4 h-16 flex-shrink-0 gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <button onclick="ToggleSidebar()" class="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors flex-shrink-0">
              <span class="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <span class="text-headline-md font-headline-md text-on-surface truncate">Lojistik Yönetim</span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button onclick="ToggleDarkMode()" title="${S.darkMode ? 'Açık tema' : 'Koyu tema'}"
              class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <span class="material-symbols-outlined text-[20px]">${S.darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button onclick="ST('sehirlerarasi')" class="bg-primary text-on-primary text-label-lg font-label-lg px-4 h-10 rounded-DEFAULT hover:opacity-90 transition-opacity flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span class="hidden sm:inline">Yeni Sevkiyat</span>
              <span class="sm:hidden">Yeni</span>
            </button>
          </div>
        </nav>
        <!-- Content mount point -->
        <main id="content" class="flex-1 overflow-auto p-margin bg-background custom-scrollbar"></main>
      </div>
    </div>`;
}
