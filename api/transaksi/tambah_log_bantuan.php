<?php
session_start();
include "../../config/koneksi.php";

$id_penduduk = $_POST['id_penduduk'];
$id_ibadah = $_POST['id_ibadah'];

// Tangani string "null" dari JavaScript agar menjadi NULL SQL yang sesungguhnya
$id_musibah = (isset($_POST['id_musibah']) && $_POST['id_musibah'] !== 'null' && $_POST['id_musibah'] !== '') ? $_POST['id_musibah'] : "NULL";

$id_admin = $_SESSION['id'] ?? 0; // Mengambil ID dari Session Admin Tempat Ibadah
$beras_kg = (float)$_POST['beras_kg'];
$minyak_l = (float)$_POST['minyak_l'];
$gula_kg = (float)$_POST['gula_kg'];
$telur_kg = (float)$_POST['telur_kg'];
$susu_kaleng = (int)$_POST['susu_kaleng'];
$uang_tunai = (int)$_POST['uang_tunai'];
$catatan = mysqli_real_escape_string($koneksi, $_POST['catatan']);
$tanggal_penyaluran = date('Y-m-d');

// 1. Simpan Log Penyaluran Bantuan
// Perhatikan bahwa $id_musibah tidak pakai tanda kutip tunggal '' agar bisa membaca NULL
$query_log = "INSERT INTO log_bantuan (id_penduduk, id_ibadah, id_musibah, id_admin, tanggal_penyaluran, beras_kg, minyak_l, gula_kg, telur_kg, susu_kaleng, uang_tunai, catatan) 
              VALUES ('$id_penduduk', '$id_ibadah', $id_musibah, '$id_admin', '$tanggal_penyaluran', '$beras_kg', '$minyak_l', '$gula_kg', '$telur_kg', '$susu_kaleng', '$uang_tunai', '$catatan')";

if(mysqli_query($koneksi, $query_log)) {
    // 2. OTOMATISASI: Jika ada musibah yang sedang "Menunggu Bantuan", ubah statusnya menjadi "Selesai Ditangani"
    $query_update_musibah = "UPDATE laporan_musibah 
                             SET status_penanganan = 'Selesai Ditangani' 
                             WHERE id_penduduk = '$id_penduduk' AND status_penanganan = 'Menunggu Bantuan'";
    mysqli_query($koneksi, $query_update_musibah);

    echo json_encode(['status' => 'success']);
} else {
    // Memberikan pesan error spesifik dari MySQL untuk debugging
    echo json_encode(['status' => 'error', 'pesan' => mysqli_error($koneksi)]);
}
?>