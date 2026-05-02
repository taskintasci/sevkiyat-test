import { S, render, showToast, setViewRenderers } from './state.js';
import { fGetir, saGetir, pGetir, musteriGetir } from './firebase.js';
import { rDashboard } from './views/dashboard.js';
import { rSA } from './views/sehirlerarasi.js';
import { rP } from './views/parsiyel.js';
import { rMusteriler } from './views/musteriler.js';
import { rFirmalar } from './views/firmalar.js';

// View renderer'ları state'e inject et (circular dependency çözümü)
setViewRenderers(rDashboard, rSA, rP, rMusteriler, rFirmalar);

async function init() {
  render(); // loading state göster
  try {
    const [f, sa, p, m] = await Promise.all([
      fGetir(), saGetir(), pGetir(), musteriGetir()
    ]);
    S.firmalar = f;
    S.saGecmis = sa;
    S.pGecmis = p;
    S.musteriler = m;
  } catch (e) {
    showToast("Firebase bağlantı hatası: " + e.message, false);
  }
  S.loading = false;
  render();
}

init();
