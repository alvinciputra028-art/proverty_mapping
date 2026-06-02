# 🗺️ WebGIS Poverty Mapping & Bansos Management System

Sebuah Sistem Informasi Geografis Berbasis Web (WebGIS) komprehensif yang dirancang untuk memetakan sebaran penduduk miskin, mengelola penyaluran Bantuan Sosial (Bansos), menangani pelaporan musibah darurat, serta manajemen talenta melalui program pelatihan. 

Sistem ini menggunakan pendekatan desentralisasi wewenang berbasis radius spasial (Tempat Ibadah sebagai pusat penyaluran tingkat lokal) dan pengawasan terpusat (Dinas Sosial sebagai Super Admin tingkat makro).

---

## ✨ Fitur Utama

### 1. Manajemen Spasial Berbasis Radius (Role-Based)
*   **Admin Lokal (Tempat Ibadah):** Hanya memiliki wewenang untuk melihat, menambah, dan menyalurkan bantuan kepada warga miskin yang berada **di dalam radius pelayanan** tempat ibadahnya.
*   **Super Admin (Dinas Sosial):** Memiliki wewenang absolut (*Bypass*) untuk menambah data di lokasi mana pun, menetapkan batas Garis Kemiskinan daerah, dan membuat Master Program Pelatihan.

### 2. Algoritma Klasifikasi Kemiskinan Otomatis
Sistem otomatis mengklasifikasikan status warga (Sangat Miskin, Miskin, Rentan Miskin) secara *real-time* dengan membandingkan **Pengeluaran per Kapita** terhadap **Garis Kemiskinan**, dikombinasikan dengan skor *Proxy Means Testing* (PMT) dari observasi fisik rumah:
*   Kondisi Lantai & Dinding
*   Fasilitas Sanitasi (MCK)
*   Sumber Listrik & Air Minum

### 3. Sistem Peringatan Musibah Darurat (*Emergency Alert*)
*   Fitur pelaporan musibah cepat (Kebakaran, Sakit Keras, dll).
*   Titik rumah warga di peta akan **berkedip merah/oranye** (Animasi CSS) untuk menarik perhatian visual Admin jika ada musibah yang berstatus "Menunggu Bantuan".
*   Status musibah otomatis berubah menjadi "Selesai Ditangani" segera setelah log bantuan disalurkan.

### 4. Manajemen Talenta & Rekomendasi Pelatihan Cerdas
*   Pendataan rincian anggota keluarga (NIK, Umur, Pendidikan, Pekerjaan).
*   **Sistem Rekomendasi Otomatis:** Anggota keluarga yang berada dalam usia produktif (17-35 Tahun) dan berstatus "Tidak Bekerja / Menganggur" akan secara otomatis direkomendasikan oleh sistem untuk diikutkan ke dalam Program Pelatihan (Keterampilan) yang diselenggarakan oleh Pemerintah.

### 5. Jejak Audit Penyaluran (*Distribution Logging*)
Setiap keluarga memiliki buku besar (*ledger*) riwayat penerimaan bantuan yang merinci tanggal penyaluran, pihak penyalur (Tempat Ibadah), hingga nominal barang (Beras, Minyak, Telur, Uang Tunai) untuk mencegah bantuan fiktif atau tumpang tindih (*overlapping*).

---

## 🛠️ Teknologi yang Digunakan

*   **Front-End:** HTML5, CSS3, Vanilla JavaScript.
*   **Mapping Library:** [Leaflet.js](https://leafletjs.com/) v1.9.4 & Leaflet Draw.
*   **Peta Dasar (Basemap):** OpenStreetMap (OSM).
*   **Geocoding:** Nominatim API (Reverse Geocoding untuk pendeteksian alamat otomatis via koordinat).
*   **Back-End:** PHP Native (Versi 7.4 - 8.x).
*   **Database:** MySQL.

---

## 📂 Struktur Direktori Proyek

Sistem ini menerapkan prinsip *Separation of Concerns* (pemisahan logika) dan DRY (*Don't Repeat Yourself*):

```text
proverty_mapping/
│
├── config/                 # Konfigurasi Database & Sesi
├── auth/                   # Logika Login/Logout Multi-User
├── api/                    # Endpoint Backend (CRUD)
│   ├── penduduk/           # Mengelola data rumah warga & kemiskinan
│   ├── anggota/            # Mengelola detail anggota keluarga
│   ├── ibadah/             # Mengelola data tempat ibadah & radius
│   ├── transaksi/          # Log Bantuan, Log Pelatihan, dan Musibah
│   └── sistem/             # Variabel global (Garis Kemiskinan)
│
├── assets/                 # Aset Front-End
│   ├── css/style.css       # File CSS Terpusat (Mendukung Multi-Tema)
│   ├── js/webgis.js        # Core Logic Peta Leaflet & Fungsi Asinkronus
│   └── data/               # Layer GeoJSON Batas Administratif (Kecamatan)
│
├── index.php               # Halaman Dasbor Admin Lokal (Tempat Ibadah)
└── index_super.php         # Halaman Dasbor Super Admin (Dinas Sosial)
```

---

## Panduan Instalasi & Menjalankan Aplikasi

1.  **Kloning Repositori:**
    ```
    git clone https://github.com/alvinciputra028-art/proverty_mapping

2.  **Pindahkan ke Server Lokal:**
    Pindahkan folder proyek ke dalam direktori server lokal Anda (contoh: `htdocs` untuk XAMPP atau `www` untuk Laragon).

3.  **Konfigurasi Database:**
    *   Buka phpMyAdmin di `http://localhost/phpmyadmin`.
    *   Buat database baru dengan nama `db_bansos_gis` (atau nama lain sesuai preferensi).
    *   *Import* file `database.sql` ke dalam database tersebut.

4.  **Konfigurasi Koneksi:**
    Buka *file* `config/koneksi.php` dan sesuaikan kredensialnya:
```php
    $host = "localhost";
    $user = "root";
    $pass = "";
    $db   = "db_bansos_gis";
```

5.  **Akses Aplikasi:**
    *   Buka *browser* dan akses: `http://localhost/proverty_mapping/auth/login.php` untuk Admin Lokal.
    *   Akses: `http://localhost/proverty_mapping/auth/login_super.php` untuk Super Admin.

---

## 🎓 Tentang Penulis

Proyek ini dikembangkan oleh:
**Alvin Andrianto Ciputra (D1041231074)**
*Mahasiswa Program Studi Teknik Informatika (Semester 6)*
*Fakultas Teknik, Universitas Tanjungpura (UNTAN)*

Proyek ini mendemonstrasikan implementasi praktis dari mata kuliah Rekayasa Perangkat Lunak, Basis Data Relasional, serta Sistem Informasi Geografis untuk menyelesaikan permasalahan nyata di lapangan.
