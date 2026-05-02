import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDW-hGQy23mZRNP9yFW7QkTrzwJ7T6inZ8",
  authDomain:        "akkim-sevkiyat.firebaseapp.com",
  projectId:         "akkim-sevkiyat",
  storageBucket:     "akkim-sevkiyat.firebasestorage.app",
  messagingSenderId: "1030526589677",
  appId:             "1:1030526589677:web:43161ed65adbf75d400ae4"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export async function fGetir(){const s=await getDocs(collection(db,"firmalar"));return s.docs.map(d=>({id:d.id,...d.data()}));}
export async function fKaydet(list){const b=writeBatch(db);list.forEach(f=>{const r=doc(collection(db,"firmalar"));b.set(r,{ad:f.ad,iletisim:f.iletisim||"",fiyatlar:f.fiyatlar,guncelleme:serverTimestamp()});});await b.commit();}
export async function fSil(id){await deleteDoc(doc(db,"firmalar",id));}
export async function saGetir(){const q=query(collection(db,"sehirlerarasi_sevkiyatlar"),orderBy("tarih","desc"));const s=await getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()}));}
export async function saKaydet(data){return addDoc(collection(db,"sehirlerarasi_sevkiyatlar"),{...data,tarih:serverTimestamp()});}
export async function saSil2(id){await deleteDoc(doc(db,"sehirlerarasi_sevkiyatlar",id));}
export async function pGetir(){const q=query(collection(db,"parsiyel_planlar"),orderBy("tarih","desc"));const s=await getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()}));}
export async function pKaydet(data){return addDoc(collection(db,"parsiyel_planlar"),{...data,tarih:serverTimestamp()});}
export async function pSil2(id){await deleteDoc(doc(db,"parsiyel_planlar",id));}
export async function musteriGetir(){const s=await getDocs(collection(db,"musteriler"));return s.docs.map(d=>({id:d.id,...d.data()}));}
export async function musteriKaydet(data){return addDoc(collection(db,"musteriler"),{...data,tarih:serverTimestamp()});}
export async function musteriTopluKaydet(list){const b=writeBatch(db);list.forEach(m=>{const r=doc(collection(db,"musteriler"));b.set(r,{ad:m.ad,sevk_adresi:m.sevk_adresi||"",il:m.il||"",ilce:m.ilce||"",tarih:serverTimestamp()});});await b.commit();}
export async function musteriSil(id){await deleteDoc(doc(db,"musteriler",id));}
export async function durumGuncelle(koleksiyon,id,durum){const {updateDoc}=await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");await updateDoc(doc(db,koleksiyon,id),{durum});}
