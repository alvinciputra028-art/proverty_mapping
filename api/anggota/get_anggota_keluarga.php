<?php
include "../../config/koneksi.php";
$id_penduduk = isset($_GET['id_penduduk']) ? (int)$_GET['id_penduduk'] : 0;

$query = mysqli_query($koneksi, "SELECT * FROM anggota_keluarga WHERE id_penduduk = '$id_penduduk'");
$data = [];

while($row = mysqli_fetch_assoc($query)) {
    // 1. Hitung Umur dari Tanggal Lahir
    $tanggal_lahir = new DateTime($row['tanggal_lahir']);
    $sekarang = new DateTime('today');
    $umur = $tanggal_lahir->diff($sekarang)->y;
    $row['umur'] = $umur;
    
    // 2. Logika Cerdas Rekomendasi Pelatihan
    $pekerjaan = strtolower($row['pekerjaan']);
    // Cek apakah ada kata "tidak bekerja", "menganggur", atau "belum bekerja"
    $nganggur = (strpos($pekerjaan, 'tidak bekerja') !== false || strpos($pekerjaan, 'menganggur') !== false || strpos($pekerjaan, 'belum') !== false);
    
    // Syarat: Umur 17-35 tahun DAN statusnya menganggur
    $row['rekomendasi_pelatihan'] = ($umur >= 17 && $umur <= 35 && $nganggur) ? true : false;
    
    $data[] = $row;
}

header('Content-Type: application/json');
echo json_encode($data);
?>