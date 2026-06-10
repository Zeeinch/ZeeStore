# 🛍️ ZeeStore — E-Commerce Website

Website e-commerce modern terinspirasi Shopee & Tokopedia. Dibangun dengan **Bootstrap 5** dan **Supabase** (authentication + database).

![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-purple?logo=bootstrap)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![HTML5](https://img.shields.io/badge/HTML5-Vanilla-orange?logo=html5)

---

## ✨ Fitur

- 🔐 **Login & Register** — Autentikasi via Supabase Auth (email/password + Google OAuth)
- 🏠 **Halaman Utama** — Katalog produk, filter kategori, pencarian
- 📦 **Detail Produk** — Info lengkap, tambah ke keranjang, beli langsung
- 🏪 **Jual Barang** — Form publish produk baru
- 🛒 **Keranjang** — Kelola item, update jumlah, hapus item
- 💳 **Checkout** — Alamat pengiriman, pilih pembayaran, konfirmasi order
- ✅ **Konfirmasi Order** — Halaman sukses dengan detail pesanan

---

## 🚀 Setup

### 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan buat project baru
2. Buka **Settings → API** dan catat:
   - `Project URL` (contoh: `https://xxxxx.supabase.co`)
   - `anon / public` key

### 2. Jalankan Database Schema

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy-paste isi file `sql/schema.sql`
3. Klik **Run** untuk membuat tabel, policies, dan data seed

### 3. Konfigurasi Website

Edit file `js/config.js` dan ganti:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 4. Jalankan Website

Buka dengan Live Server (VS Code) atau langsung buka `index.html` di browser.

Atau gunakan server sederhana:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .
```

Buka `http://localhost:8000` di browser.

---

## 📁 Struktur File

```
ZeeStore/
├── index.html          ← Login & Register
├── home.html           ← Halaman utama + katalog
├── product.html        ← Detail produk
├── sell.html           ← Form jual barang
├── cart.html           ← Keranjang belanja
├── checkout.html       ← Checkout & konfirmasi
├── css/
│   └── style.css       ← Custom styles
├── js/
│   ├── config.js       ← Supabase credentials
│   ├── auth.js         ← Auth module
│   ├── home.js         ← Home page logic
│   ├── product.js      ← Product detail logic
│   ├── sell.js         ← Sell form logic
│   ├── cart.js         ← Cart logic
│   └── checkout.js     ← Checkout logic
└── sql/
    └── schema.sql      ← Database schema & seed
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | Bootstrap 5.3 + Bootstrap Icons |
| Font | Google Fonts (Inter) |
| Auth & DB | Supabase |
| Deployment | Static files (no build step) |

---

## 📝 Catatan

- Semua library dimuat via CDN (tidak perlu `npm install`)
- Data produk seed sudah termasuk 12 produk fiktif dari 6 kategori
- Gambar produk menggunakan Unsplash (gratis)
- Harga dalam Rupiah (IDR)
- Row Level Security (RLS) aktif di semua tabel

---

**Made with ❤️ by ZeeStore Team**