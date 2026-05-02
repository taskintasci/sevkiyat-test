import { renderShell } from './components/shell.js';

let _rDashboard, _rSA, _rP, _rMusteriler, _rFirmalar;

// Dark mode — init before first render
const _initDark = localStorage.getItem('darkMode') === 'true';
if (_initDark) document.documentElement.classList.add('dark');

export const S = {
  tab: "dashboard",
  at: { sa: "yeni", p: "yeni" },
  firmalar: [],
  saGecmis: [],
  pGecmis: [],
  musteriler: [],
  sa_il: "",
  sa_ilce: "",
  sa_firma: null,
  sa_tonaj: "",
  sa_musteri: "",
  sa_bekleme: [],
  sa_expand: null,
  p_sec: [],
  p_il: "",
  p_ilce: "",
  p_musteri: "",
  p_bekleme: [],
  p_plan: null,
  p_drag_src: null,
  _mIl: "",
  loading: true,
  saving: false,
  toast: null,
  darkMode: _initDark,
  sidebarOpen: false,
  dash_search: '',
  dash_durum: '',
};

export function showToast(text, ok = true) {
  S.toast = { text, ok };
  render();
  setTimeout(() => { S.toast = null; render(); }, 3000);
}

export function setViewRenderers(dash, sa, p, mus, firm) {
  _rDashboard = dash; _rSA = sa; _rP = p; _rMusteriler = mus; _rFirmalar = firm;
}

export function render() {
  document.documentElement.classList.toggle('dark', S.darkMode);

  const loadingHTML = `
    <div class="flex items-center justify-center h-full p-20">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full"></div>
        <p class="text-on-surface-variant text-sm">Yükleniyor...</p>
      </div>
    </div>`;

  const viewMap = {
    dashboard: _rDashboard,
    sehirlerarasi: _rSA,
    parsiyel: _rP,
    musteriler: _rMusteriler,
    firmalar: _rFirmalar,
  };

  const appEl = document.getElementById("app");
  if (!appEl) return;

  appEl.innerHTML = renderShell(S);

  const contentEl = document.getElementById("content");
  if (contentEl) {
    const viewFn = viewMap[S.tab];
    contentEl.innerHTML = S.loading ? loadingHTML : (viewFn ? viewFn(S) : loadingHTML);
  }

  // Toast overlay
  const existing = document.getElementById("toast-overlay");
  if (existing) existing.remove();
  if (S.toast) {
    const toastEl = document.createElement("div");
    toastEl.id = "toast-overlay";
    toastEl.className = `fixed bottom-6 right-6 z-50 toast-enter px-4 py-3 rounded-lg shadow-lg font-semibold text-sm ${S.toast.ok ? 'bg-primary text-on-primary' : 'bg-error text-on-error'}`;
    toastEl.textContent = S.toast.text;
    document.body.appendChild(toastEl);
  }
}

// Global handlers
window.ST = t => { S.tab = t; S.sidebarOpen = false; render(); };
window.ToggleSidebar = () => { S.sidebarOpen = !S.sidebarOpen; render(); };
window.CloseSidebar = () => { S.sidebarOpen = false; render(); };
window.ToggleDarkMode = () => {
  S.darkMode = !S.darkMode;
  localStorage.setItem('darkMode', S.darkMode);
  render();
};
window.DS = v => { S.dash_search = v; render(); };
window.DD = v => { S.dash_durum = v; render(); };
window.DFTemizle = () => { S.dash_search = ''; S.dash_durum = ''; render(); };
window.SAExpand = id => { S.sa_expand = S.sa_expand === id ? null : id; render(); };
