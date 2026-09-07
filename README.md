# PPKLJ — Frontend Web Application

Aplikasi web antarmuka untuk sistem **PPKLJ (Pengelolaan Perangkat Jaringan & Lisensi)**, platform operasional internal kantor IT pemerintahan untuk mengelola pengadaan belanja DIPA (Belanja Modal MAK 53 & Belanja Pemeliharaan MAK 52), inventaris perangkat keras jaringan dan lisensi perangkat lunak, masa berlaku garansi, serta pelacakan alur perbaikan dan klaim garansi *Return Merchandise Authorization* (RMA).

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Komponen UI**: [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Ikon**: [Lucide React](https://lucide.dev/)
- **Data Fetching & Cache**: [SWR 2.5](https://swr.vercel.app/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Data Table**: [TanStack Table v8](https://tanstack.com/table/latest) (Sorting, Filtering, Pagination)

---

## 📦 Modul & Fitur Utama

### 1. Dashboard Terpisah (*Split View*)
- **Dashboard Perangkat Jaringan**:
  - Metrik operasional perangkat aktif, unit cadangan/belum terpasang (*inventory*), dan unit dengan garansi kritis/habis.
  - Komposisi tipe perangkat (*Access Point*, *Switch*, *Controller*) dengan visualisasi persentase.
  - Distribusi alokasi unit berdasarkan kantor penempatan.
  - Tabel perangkat yang membutuhkan perpanjangan garansi ($\le 60$ hari atau sudah kedaluwarsa).
- **Dashboard Lisensi Software**:
  - Metrik masa aktif lisensi (*Active*, *Perpetual*, *Expiring Soon $\le 30$ hari*, *Expired*).
  - Ringkasan akumulasi nilai investasi lisensi dan rata-rata biaya per lisensi.
  - Agenda jadwal perpanjangan dan jatuh tempo lisensi terdekat lengkap dengan sisa hari aktif.

### 2. Pos Anggaran & Paket Belanja (`/purchases`)
- Pengelolaan pos belanja DIPA per tahun anggaran:
  - **Akun 53**: Belanja Modal (Pengadaan unit baru).
  - **Akun 52**: Belanja Pemeliharaan & Jasa (Perpanjangan masa garansi/kontrak).
- **Pencatatan Pengadaan Massal (`/purchases/[id]/procurement`)**:
  - Mencatat paket belanja modal sekaligus membangkitkan puluhan/ratusan unit serial number fisik otomatis dalam 1 kali proses.
- **Pencatatan Pemeliharaan Massal (`/purchases/[id]/maintenance`)**:
  - Memilih seluruh unit dari paket pengadaan sebelumnya hanya dengan 1 klik (misal: perpanjang garansi 100 unit AP Aruba).
  - Mendukung relasi *Many-to-Many* melalui tabel pivot, sehingga riwayat belanja berulang tidak saling menimpa data pengadaan awal.
  - Otomatis memperbarui tanggal akhir garansi (`end_date`) pada unit aset terkait.
- **Modal Inspeksi Unit**: Memeriksa daftar seluruh unit aset yang dibiayai oleh paket belanja tertentu.

### 3. Inventaris Perangkat Jaringan (`/network-assets`)
- Manajemen katalog perangkat keras jaringan lengkap: IP Address manajemen, Hostname, MAC Address, Merk (*Brand*), Seri/Model, Tipe, Status Operasional (`aktif`, `belum_dipasang`, `tidak_aktif`), dan Lokasi Kantor Penempatan.
- Tagging fitur teknis perangkat (*PoE+*, *VLAN*, *L3 Routing*, dll).
- Riwayat siklus hidup belanja (*Lifecycle History*) per unit aset.

### 4. Inventaris Lisensi Software (`/licenses`)
- Pencatatan lisensi sistem operasi, firewall, antivirus, dan dukungan cloud.
- Deteksi otomatis status masa berlaku (*Perpetual*, *Aktif*, *Segera Berakhir $\le 30$ hari*, *Kadaluarsa*) dengan format tanggal standar Indonesia (`formatDateIndo`).
- Riwayat perpanjangan dan pemeliharaan kontrak per lisensi.

### 5. Modul Klaim Garansi & RMA (`/rmas`)
- Pencatatan tiket klaim perbaikan/garansi perangkat rusak (*Return Merchandise Authorization*).
- Pelacakan alur pengiriman bertahap (*Timeline Tracking Progression*):
  - *Rusak di Lokasi* ➔ *Dikirim ke Pusat* ➔ *Diterima PPKLJ* ➔ *Diserahkan ke Vendor* ➔ *Diproses* ➔ *Dikirim Kembali* ➔ *Selesai Dipasang*.
- Penanganan resolusi klaim:
  - **Perangkat Diperbaiki**: Serial number tetap sama, perangkat diaktifkan kembali.
  - **Ganti Unit Baru (*Swap*)**: Serial number baru otomatis memperbarui master aset di inventaris.

### 6. Master Kantor (`/offices`) & Fitur Teknis (`/features`)
- Master data kantor vertikal (Kantor Wilayah / UPT) dan Kantor Pusat.
- Master data tag fitur spesifikasi perangkat keras.

### 7. Autentikasi Stateful SPA (`/login`)
- Integrasi sesi cookie aman (*Stateful Session Cookies*) dengan Laravel Sanctum (`withCredentials: true`).
- Proteksi seluruh rute internal melalui komponen `<AuthGuard>`.

---

## 📁 Struktur Direktori

```text
frontend/
├── app/
│   ├── (dashboard)/            # Route group terproteksi AuthGuard
│   │   ├── layout.tsx          # Shell layout (Sidebar + Header)
│   │   ├── page.tsx            # Split Dashboard (Perangkat & Lisensi)
│   │   ├── network-assets/     # Modul inventaris perangkat jaringan
│   │   ├── licenses/           # Modul lisensi software
│   │   ├── purchases/          # Modul belanja, procurement, & maintenance
│   │   ├── rmas/               # Modul klaim garansi & tracking RMA
│   │   ├── offices/            # Master data kantor
│   │   └── features/           # Master data fitur teknis
│   ├── login/                  # Halaman otentikasi masuk
│   ├── layout.tsx              # Root HTML & provider font
│   └── globals.css             # Konfigurasi Tailwind CSS v4 & theme
├── components/                 # Komponen modular reusable
│   ├── ui/                     # Komponen primitif shadcn/ui
│   ├── app-sidebar.tsx         # Navigasi sidebar sistem
│   ├── auth-guard.tsx          # Pengaman rute terproteksi
│   ├── dashboard-header.tsx    # Header navbar & navigasi profil
│   └── asset-lifecycle-history.tsx # Histori belanja per unit aset
├── hooks/
│   └── use-auth.ts             # Hook sesi login/logout via SWR
├── lib/
│   ├── api.ts                  # Client fetcher, mutation, & CSRF handler
│   ├── types.ts                # TypeScript interfaces & payload models
│   └── utils.ts                # Helper styling (cn) & formatDateIndo
└── next.config.ts              # Konfigurasi Next.js
```

---

## 🛠️ Menjalankan Lokal (Development)

### 1. Prasyarat
- Node.js >= 20.x
- npm >= 10.x
- Backend API Laravel PPKLJ sudah berjalan (default port `8000`)

### 2. Instalasi & Menjalankan
```bash
# 1. Masuk ke direktori frontend
cd frontend

# 2. Install dependensi
npm ci

# 3. Jalankan development server (Turbopack)
npm run dev
```

Aplikasi dapat diakses melalui browser di: **`http://localhost:3000`**

### 3. Perintah Tambahan
```bash
# Pengecekan tipe TypeScript
npm run typecheck

# Menjalankan linter ESLint
npm run lint

# Kompilasi build production
npm run build

# Menjalankan server production
npm run start
```

---

## 🌐 Konfigurasi Lingkungan (Environment Variables)

Secara bawaan, frontend otomatis mendeteksi backend di port `8000` sesuai hostname aktif (`localhost:8000` atau `127.0.0.1:8000`). Jika ingin mengarahkan ke URL server khusus, buat file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
