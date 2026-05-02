// window.XLSX global olarak CDN'den yüklü

export function normH(h){return String(h).trim().replace(/[İI]/g,"I").replace(/[Şş]/g,"s").replace(/[Ğğ]/g,"g").replace(/[Üü]/g,"u").replace(/[Öö]/g,"o").replace(/[Çç]/g,"c").replace(/ı/g,"i").toLowerCase().replace(/^.*firma.*/,"firma").replace(/^.*ilc.*/,"ilce").replace(/^.*\bil\b.*/,"il").replace(/^.*seh.*/,"il").replace(/^.*fiy.*/,"fiyat").replace(/^.*\buc\b.*/,"fiyat").replace(/^.*tut.*/,"fiyat").replace(/^.*tel.*/,"tel").replace(/^.*ilet.*/,"tel");}

export function normHdr(h){const s=String(h).trim();const l=s.replace(/İ/g,"I").replace(/Ş/g,"S").replace(/Ğ/g,"G").replace(/Ü/g,"U").replace(/Ö/g,"O").replace(/Ç/g,"C").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").toLowerCase();if(l.includes("firma"))return"firma";if(l.includes("ilc"))return"ilce";if((l.includes("il")&&!l.includes("ilc"))||l.includes("seh"))return"il";if(l.includes("fiy")||l.includes("tut"))return"fiyat";if(l.includes("tel")||l.includes("ilet"))return"tel";return l;}

export async function excelOku(file){
  const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:"array"});const ws=wb.Sheets[wb.SheetNames[0]];const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
  let hr=-1;
  for(let i=0;i<Math.min(raw.length,15);i++){const t=raw[i].map(c=>normHdr(String(c))).filter(h=>["firma","il","ilce","fiyat","tel"].includes(h));if(t.length>=3){hr=i;break;}}
  if(hr===-1){return[];}
  const hdrs=raw[hr].map(c=>normHdr(String(c))),rows=[];
  for(let i=hr+1;i<raw.length;i++){if(raw[i].every(c=>c===""||c===null))continue;const r={};hdrs.forEach((h,j)=>r[h]=String(raw[i][j]||"").trim());if(r.firma&&r.il&&r.ilce)rows.push(r);}
  return rows;
}

export function rowsToFirmalar(rows){const m={};rows.forEach(r=>{const f=parseFloat(String(r.fiyat||"").replace(/[^\d.,]/g,"").replace(",","."));if(isNaN(f)||f<=0)return;if(!m[r.firma])m[r.firma]={ad:r.firma,iletisim:r.tel||"",fiyatlar:{}};m[r.firma].fiyatlar[r.il+"__"+r.ilce]=f;});return Object.values(m);}

export function OrnekIndir(){
  const wb=XLSX.utils.book_new();
  const data=[["Firma Adi","Telefon","Varis Ili","Varis Ilcesi","Fiyat"],["Hizli Nakliyat","0212 555 01 01","Istanbul","Kadikoy",1500],["Guveli Lojistik","0216 444 02 02","Istanbul","Kadikoy",1400]];
  const ws=XLSX.utils.aoa_to_sheet(data);ws["!cols"]=[{wch:28},{wch:16},{wch:14},{wch:16},{wch:12}];
  XLSX.utils.book_append_sheet(wb,ws,"Fiyat Listesi");XLSX.writeFile(wb,"ornek_fiyat_listesi.xlsx");
}

export function MusteriOrnekIndir(){
  const wb=XLSX.utils.book_new();
  const data=[
    ["Firma","Sevk Adresi","Il","Ilce"],
    ["Akkim Kimya A.S.","Organize Sanayi Bolgesi No:5","Yalova","Merkez"],
    ["Marmara Insaat Ltd.","Bagcilar Mah. Sanayi Cad. No:12","Istanbul","Kadikoy"],
    ["Ege Gida San. Tic.","Ataturk OSB 3. Cadde No:8","Izmir","Konak"],
    ["Bosphorus Lojistik","Dudullu OSB 1. Sok. No:4","Istanbul","Pendik"],
    ["Anadolu Celik Boru","Gebze OSB 100. Yil Bulvari No:22","Kocaeli","Gebze"],
    ["Trakya Tekstil A.S.","Corlu OSB Plastik Cad. No:7","Tekirdag","Corlu"],
    ["Marmara Ambalaj","Bursa OSB 6. Cadde No:15","Bursa","Osmangazi"],
  ];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws["!cols"]=[{wch:28},{wch:36},{wch:14},{wch:14}];
  ["A1","B1","C1","D1"].forEach(cell=>{if(ws[cell])ws[cell].s={font:{bold:true}};});
  XLSX.utils.book_append_sheet(wb,ws,"Musteriler");
  XLSX.writeFile(wb,"ornek_musteri_listesi.xlsx");
}

export function ExcelRapor(S){
  const wb=XLSX.utils.book_new();
  // Şehirler arası sheet
  const saData=[["Tarih","Musteri","Varis Il","Varis Ilce","Firma","Plaka(lar)","Tonaj","Fiyat (TL)","Durum"]];
  S.saGecmis.forEach(s=>{
    const tarih=s.tarih?(s.tarih.toDate?s.tarih.toDate():new Date(s.tarih)).toLocaleDateString("tr-TR"):"";
    const plakalar=(s.araclar||[]).map(a=>a.plaka||"").filter(Boolean).join(", ");
    saData.push([tarih,s.musteri||"",s.varis_il,s.varis_ilce,s.firma_ad,plakalar,s.toplam_ton||s.tonaj||"",s.fiyat||0,s.durum||"Planlandı"]);
  });
  const ws1=XLSX.utils.aoa_to_sheet(saData);ws1["!cols"]=[{wch:14},{wch:16},{wch:12},{wch:14},{wch:22},{wch:16},{wch:10},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb,ws1,"Sehirler Arasi");
  // Parsiyel sheet
  const pData=[["Tarih","Kamyon No","Arac Tipi","Plaka","Durak Sayisi","Toplam Ton","Aciklama"]];
  S.pGecmis.forEach(p=>{
    const tarih=p.tarih?(p.tarih.toDate?p.tarih.toDate():new Date(p.tarih)).toLocaleDateString("tr-TR"):"";
    (p.kamyonlar||[]).forEach(k=>{pData.push([tarih,k.no,k.tip||"",k.plaka||"",(k.noktalar||[]).length,k.toplam_ton||"",k.aciklama||""]);});
  });
  const ws2=XLSX.utils.aoa_to_sheet(pData);ws2["!cols"]=[{wch:14},{wch:10},{wch:12},{wch:14},{wch:12},{wch:12},{wch:24}];
  XLSX.utils.book_append_sheet(wb,ws2,"Parsiyel");
  // Firma performans sheet
  const firmaMap={};S.saGecmis.forEach(s=>{if(!s.firma_ad)return;if(!firmaMap[s.firma_ad])firmaMap[s.firma_ad]={ad:s.firma_ad,sayi:0,toplam:0};firmaMap[s.firma_ad].sayi++;firmaMap[s.firma_ad].toplam+=(s.fiyat||0);});
  const fData=[["Firma Adi","Sevkiyat Sayisi","Toplam Harcama (TL)","Ortalama Fiyat (TL)"]];
  Object.values(firmaMap).sort((a,b)=>b.sayi-a.sayi).forEach(f=>{fData.push([f.ad,f.sayi,f.toplam,Math.round(f.toplam/f.sayi)]);});
  const ws3=XLSX.utils.aoa_to_sheet(fData);ws3["!cols"]=[{wch:28},{wch:16},{wch:20},{wch:18}];
  XLSX.utils.book_append_sheet(wb,ws3,"Firma Performansi");
  XLSX.writeFile(wb,"sevkiyat_raporu_"+new Date().toLocaleDateString("tr-TR").replace(/\./g,"-")+".xlsx");
}
