import { YALOVA } from './data.js';

export function mesafe(a, b, c, d) {
  const R = 6371, dL = (c - a) * Math.PI / 180, dN = (d - b) * Math.PI / 180;
  const x = Math.sin(dL / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function fmtTarih(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function aracTipi(t) {
  if (t <= 10) return { tip: "Kamyonet", max: 10, icon: "🚐", renk: "#10B981" };
  if (t <= 19) return { tip: "Kamyon",   max: 19, icon: "🚛", renk: "#3B82F6" };
  return            { tip: "TIR",        max: 24, icon: "🚚", renk: "#F59E0B" };
}

export function tonajiBol(top) {
  const lst = [];
  let k = top;
  while (k > 0.01) {
    let y = k > 19 ? Math.min(k, 24) : k > 10 ? Math.min(k, 19) : Math.min(k, 10);
    y = parseFloat(y.toFixed(2));
    lst.push({ ...aracTipi(y === 24 ? 24 : y === 19 ? 19 : y), yukTon: y });
    k = parseFloat((k - y).toFixed(10));
  }
  return lst;
}

// ── 2-opt iyileştirme (nearest-neighbor sonrası) ──
function twoOpt(pts) {
  if (pts.length <= 2) return pts;

  const coord = n => ({ lat: n.ilce.lat, lng: n.ilce.lng });
  const dist  = (a, b) => mesafe(a.lat, a.lng, b.lat, b.lng);

  let route    = [...pts];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const prevI = i === 0               ? YALOVA : coord(route[i - 1]);
        const nextJ = j === route.length - 1 ? YALOVA : coord(route[j + 1]);
        const ci    = coord(route[i]);
        const cj    = coord(route[j]);

        const before = dist(prevI, ci) + dist(cj, nextJ);
        const after  = dist(prevI, cj) + dist(ci, nextJ);

        if (after < before - 0.01) {
          route = [
            ...route.slice(0, i),
            ...route.slice(i, j + 1).reverse(),
            ...route.slice(j + 1),
          ];
          improved = true;
        }
      }
    }
  }
  return route;
}

export function rotaSirala(pts) {
  // Koordinatsız noktaları sonuna at, koordinatlıları sırala
  const valid   = pts.filter(n => n.ilce?.lat != null && n.ilce?.lng != null);
  const invalid = pts.filter(n => n.ilce?.lat == null || n.ilce?.lng == null);

  if (!valid.length) return pts;

  // Nearest-neighbor heuristic (başlangıç: Yalova)
  const kal = [...valid];
  const s   = [];
  let mv    = { lat: YALOVA.lat, lng: YALOVA.lng };

  while (kal.length) {
    let ei = 0, ed = Infinity;
    kal.forEach((n, i) => {
      const d = mesafe(mv.lat, mv.lng, n.ilce.lat, n.ilce.lng);
      if (d < ed) { ed = d; ei = i; }
    });
    s.push(kal[ei]);
    mv = { lat: kal[ei].ilce.lat, lng: kal[ei].ilce.lng };
    kal.splice(ei, 1);
  }

  // 2-opt iyileştirme + koordinatsızları sona ekle
  return [...twoOpt(s), ...invalid];
}

// ── Aynı ilçedeki noktaları birleştir (bir araç içinde) ──
function konsolideDuraklar(noktalar) {
  const merged = [];
  for (const n of noktalar) {
    const mevcut = merged.find(m => m.ilce.ad === n.ilce.ad && m.ilce.il === n.ilce.il);
    if (mevcut) {
      mevcut.tonaj = parseFloat((mevcut.tonaj + n.tonaj).toFixed(2));
    } else {
      merged.push({ ...n, tonaj: n.tonaj });
    }
  }
  return merged;
}

function makeUF(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank   = new Array(n).fill(0);
  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(x, y) {
    const px = find(x), py = find(y);
    if (px === py) return false;
    if (rank[px] < rank[py]) parent[px] = py;
    else if (rank[px] > rank[py]) parent[py] = px;
    else { parent[py] = px; rank[px]++; }
    return true;
  }
  return { find, union };
}

export function grupla(sec) {
  const MAX_TIR = 24;
  if (!sec.length) return [];

  // >24t noktaları parçala
  const expanded = [];
  for (const item of sec) {
    let rem = item.tonaj;
    while (rem > 0.001) {
      const chunk = parseFloat(Math.min(rem, MAX_TIR).toFixed(2));
      expanded.push({ ilce: item.ilce, tonaj: chunk });
      rem = parseFloat((rem - chunk).toFixed(10));
    }
  }

  const n    = expanded.length;
  const uf   = makeUF(n);
  const compTon = expanded.map(p => p.tonaj);

  // Her bileşenin İstanbul yakası (null = İstanbul dışı veya yaka yok)
  const compYaka = expanded.map(p =>
    (p.ilce.il === 'İstanbul' && p.ilce.yaka) ? p.ilce.yaka : null
  );

  // Clarke-Wright savings
  const candidates = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ni = expanded[i], nj = expanded[j];
      // Koordinat eksikse 0 savings ver (ayrı araç olsun)
      if (!ni.ilce?.lat || !nj.ilce?.lat) { candidates.push({ i, j, savings: 0 }); continue; }
      candidates.push({
        i, j,
        savings:
          mesafe(YALOVA.lat, YALOVA.lng, ni.ilce.lat, ni.ilce.lng) +
          mesafe(YALOVA.lat, YALOVA.lng, nj.ilce.lat, nj.ilce.lng) -
          mesafe(ni.ilce.lat, ni.ilce.lng, nj.ilce.lat, nj.ilce.lng),
      });
    }
  }
  candidates.sort((a, b) => b.savings - a.savings);

  for (const { i, j } of candidates) {
    const pi = uf.find(i), pj = uf.find(j);
    if (pi === pj) continue;
    if (compTon[pi] + compTon[pj] > MAX_TIR) continue;
    // Farklı İstanbul yakası durakları aynı araçta birleştirme
    if (compYaka[pi] && compYaka[pj] && compYaka[pi] !== compYaka[pj]) continue;
    const merged = parseFloat((compTon[pi] + compTon[pj]).toFixed(2));
    uf.union(i, j);
    const newRoot = uf.find(i);
    compTon[newRoot] = merged;
    compYaka[newRoot] = compYaka[pi] || compYaka[pj];
  }

  // Bileşenleri topla
  const compMap = new Map();
  for (let i = 0; i < n; i++) {
    const root = uf.find(i);
    if (!compMap.has(root)) compMap.set(root, []);
    compMap.get(root).push(i);
  }

  const res = [];
  for (const [root, indices] of compMap) {
    const ham      = indices.map(i => expanded[i]);
    const sorted   = rotaSirala(ham);
    const noktalar = konsolideDuraklar(sorted); // aynı ilçeyi birleştir
    const toplamTon = compTon[root];
    const a = aracTipi(toplamTon);
    res.push({ noktalar, toplamTon, maxTon: a.max, tip: a.tip, icon: a.icon, renk: a.renk });
  }

  res.sort((a, b) => b.toplamTon - a.toplamTon);
  res.forEach((k, i) => k.no = i + 1);
  return res;
}
