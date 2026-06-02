<?php
include "config/koneksi.php";
include "config/check_session_super.php";

$nama_superadmin = $_SESSION['nama_lengkap'] ?? 'Super Admin / Dinas Sosial';

$garis_kemiskinan = 700000;
$query_pengaturan = mysqli_query($koneksi, "SELECT garis_kemiskinan FROM pengaturan WHERE id = 1");
if($query_pengaturan && mysqli_num_rows($query_pengaturan) > 0) {
    $row_pengaturan = mysqli_fetch_assoc($query_pengaturan);
    $garis_kemiskinan = $row_pengaturan['garis_kemiskinan'];
}

// Mengambil Data JSON untuk Peta
$query_str_ibadah = "SELECT t.*, (SELECT COUNT(*) FROM log_bantuan l WHERE l.id_ibadah = t.id) as total_log FROM tempat_ibadah t";
$qi = mysqli_query($koneksi, $query_str_ibadah); $di = [];
if($qi) { while ($r = mysqli_fetch_assoc($qi)) { $r['radius'] = (float)$r['radius']; $r['warga_count'] = 0; $di[] = $r; } }

$query_str_penduduk = "
    SELECT p.*, 
    (SELECT COUNT(id) FROM laporan_musibah lm WHERE lm.id_penduduk = p.id AND lm.status_penanganan = 'Menunggu Bantuan') as is_darurat,
    (SELECT id FROM laporan_musibah lm WHERE lm.id_penduduk = p.id AND lm.status_penanganan = 'Menunggu Bantuan' ORDER BY tanggal_lapor DESC LIMIT 1) as id_musibah_aktif
    FROM penduduk_miskin p";
$qp = mysqli_query($koneksi, $query_str_penduduk); $dp = [];
if($qp) { while ($r = mysqli_fetch_assoc($qp)) { $dp[] = $r; } }
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dashboard Super Admin - WebGIS Proverty Mapping</title>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>

    <link rel="stylesheet" href="assets/css/style.css" />
</head>

<body class="theme-super">
    <div class="app-container">
        <div id="sidebar">
            <h2>KENDALI SUPER ADMIN</h2>
            <p style="font-size: 0.85rem; color: #7f8c8d; margin-top: -5px; margin-bottom: 15px;">Login sebagai: <b><?php echo $nama_superadmin; ?></b></p>

            <div class="setting-box">
                <label style="color: #8e44ad;">⚙️ Pengaturan Garis Kemiskinan</label>
                <div style="display: flex; gap: 5px;">
                    <input type="number" id="input_gk" value="<?php echo $garis_kemiskinan; ?>" style="margin-bottom: 0;">
                    <button onclick="updateGarisKemiskinan()" style="background-color: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 0 10px;">Simpan</button>
                </div>
                <small style="color: #7f8c8d; font-size: 0.75rem;">*Perubahan mempengaruhi klasifikasi seluruh warga.</small>
            </div>

            <h4>1. Navigasi & Pencarian</h4>
            <button class="sidebar-btn btn-geo" onclick="cariLokasiSaya()">📍 Posisikan di Lokasi Saya</button>
            <input type="text" id="searchInput" placeholder="Cari Tempat Ibadah atau Warga..." onkeypress="handleEnter(event)">
            <button class="sidebar-btn" onclick="cariData()">🔍 Cari Data</button>

            <h4>2. Manajemen Kebijakan Makro</h4>
            <button class="sidebar-btn btn-master" onclick="bukaModalMasterPelatihan()">🏢 Kelola Program Pelatihan</button>

            <h4>3. Mode Tambah Data Peta</h4>
            <select id="modeTambah" style="font-weight: bold; color: #2c3e50;">
                <option value="warga">Tambah Warga Miskin Baru</option>
                <option value="ibadah">Tambah Tempat Ibadah Baru</option>
            </select>
            <div id="drawControlWrapper"></div>
            <small style="color: #7f8c8d; font-size: 0.8rem; line-height: 1.4; display: block; margin-top: 5px;">
                <i>Pilih mode, lalu gunakan tool Marker untuk menambah titik baru di area mana saja.</i>
            </small>

            <h4>4. Tampilan Lapisan Peta</h4>
            <div id="layerControlWrapper"></div> 

            <button class="sidebar-btn btn-logout" onclick="konfirmasiLogout('auth/logout.php')">🚪 Keluar (Logout)</button>
        </div>
        <div id="map"></div>
    </div>

    <div id="keluargaModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="tutupModal('keluargaModal')">&times;</span>
            <h3 id="modalTitle" style="margin-top:0; color:#2c3e50; border-bottom:2px solid #2980b9; padding-bottom:10px;">Detail Anggota Keluarga</h3>
            <div id="modalBody"><p>Memuat data...</p></div>
        </div>
    </div>

    <div id="masterPelatihanModal" class="modal">
        <div class="modal-content" style="max-width: 700px;">
            <span class="close-modal" onclick="tutupModal('masterPelatihanModal')">&times;</span>
            <h3 style="margin-top:0; color:#16a085; border-bottom:2px solid #16a085; padding-bottom:10px;">🏢 Kelola Master Program Pelatihan</h3>
            <div style="background-color: #e8f8f5; border: 1px solid #1abc9c; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <h4 style="margin-top:0; color:#16a085;">+ Buat Program Pelatihan Baru</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <div style="flex: 1 1 45%;"><label>Nama Pelatihan</label><input type="text" id="mp_nama" placeholder="Cth: Pelatihan Las Listrik"></div>
                    <div style="flex: 1 1 45%;"><label>Instansi Penyelenggara</label><input type="text" id="mp_instansi" placeholder="Cth: Balai Latihan Kerja"></div>
                    <div style="flex: 1 1 45%;"><label>Tanggal Mulai</label><input type="date" id="mp_mulai"></div>
                    <div style="flex: 1 1 45%;"><label>Tanggal Selesai</label><input type="date" id="mp_selesai"></div>
                    <div style="flex: 1 1 100%;"><label>Deskripsi / Persyaratan</label><textarea id="mp_deskripsi" rows="2"></textarea></div>
                    <button class="btn-save" style="margin-top: 0;" onclick="simpanMasterPelatihan()">Simpan Program Baru</button>
                </div>
            </div>
            <div id="listMasterPelatihan"><p>Memuat daftar pelatihan aktif...</p></div>
        </div>
    </div>

    <div id="riwayatBantuanModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="tutupModal('riwayatBantuanModal')">&times;</span>
            <h3 id="rbModalTitle" style="margin-top:0; color:#8e44ad; border-bottom:2px solid #8e44ad; padding-bottom:10px;">📜 Riwayat Bantuan</h3>
            <div id="rbModalBody"><p>Memuat data...</p></div>
        </div>
    </div>

    <div id="riwayatPelatihanModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="tutupModal('riwayatPelatihanModal')">&times;</span>
            <h3 id="rpModalTitle" style="margin-top:0; color:#16a085; border-bottom:2px solid #16a085; padding-bottom:10px;">🎓 Riwayat Pelatihan</h3>
            <div id="rpModalBody"><p>Memuat data...</p></div>
        </div>
    </div>

    <script>
        const IS_SUPER_ADMIN = true; // Flag khusus Super Admin
        const ADMIN_ID_IBADAH = 0; // Super admin bebas dari radius
        const GARIS_KEMISKINAN_KALBAR = <?php echo $garis_kemiskinan; ?>; 
        const DATA_IBADAH = <?php echo json_encode($di); ?>;
        const DATA_PENDUDUK = <?php echo json_encode($dp); ?>;
    </script>
    
    <script src="assets/js/webgis.js"></script>
</body>
</html>