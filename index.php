<?php
include "config/koneksi.php";
include "config/check_session.php";

$admin_id_ibadah = $_SESSION['id_ibadah'] ?? 0; 

// Mengambil Nama Tempat Ibadah
$nama_ibadah = "Tidak Diketahui";
$query_ibadah = mysqli_query($koneksi, "SELECT nama FROM tempat_ibadah WHERE id = '$admin_id_ibadah'");
if($query_ibadah && mysqli_num_rows($query_ibadah) > 0) {
    $row_ibadah = mysqli_fetch_assoc($query_ibadah);
    $nama_ibadah = $row_ibadah['nama'];
}

// Mengambil Garis Kemiskinan
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
    <title>Dashboard Admin - WebGIS Proverty Mapping</title>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>

    <link rel="stylesheet" href="assets/css/style.css" />
</head>

<body>
    <div class="app-container">
        <div id="sidebar">
            <h2>Panel Admin Tempat Ibadah</h2>
            <p style="font-size: 0.85rem; color: #7f8c8d; margin-top: -5px; margin-bottom: 2px;">Login sebagai: <b><?php echo $_SESSION['nama'] ?? 'Admin'; ?></b></p>
            <p style="font-size: 0.85rem; color: #7f8c8d; margin-top: 0;">Tempat Ibadah: <b><?php echo $nama_ibadah; ?></b></p><hr>

            <h4>1. Navigasi Peta</h4>
            <button class="sidebar-btn btn-geo" onclick="cariLokasiSaya()">📍 Posisikan di Lokasi Saya</button>
            <input type="text" id="searchInput" placeholder="Cari Nama Warga..." onkeypress="handleEnter(event)">
            <button class="sidebar-btn" onclick="cariData()">🔍 Cari Warga</button><hr>

            <h4>2. Tambah Warga Miskin</h4>
            <div id="drawControlWrapper"></div>
            <small style="color: #7f8c8d; font-size: 0.8rem; line-height: 1.4; display: block; margin-top: 5px;">
                <i>Klik ikon Marker (Pin), lalu klik pada rumah warga untuk memasukkan data Induk baru.</i>
            </small><hr>

            <h4>3. Tampilan Peta</h4>
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
        const IS_SUPER_ADMIN = false;
        const ADMIN_ID_IBADAH = <?php echo $admin_id_ibadah; ?>;
        const GARIS_KEMISKINAN_KALBAR = <?php echo $garis_kemiskinan; ?>; 
        const DATA_IBADAH = <?php echo json_encode($di); ?>;
        const DATA_PENDUDUK = <?php echo json_encode($dp); ?>;
    </script>
    
    <script src="assets/js/webgis.js"></script>
</body>
</html>