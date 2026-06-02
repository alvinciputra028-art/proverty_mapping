<?php
include "../../config/koneksi.php";

$id_penduduk = $_POST['id_penduduk'];
$id_ibadah = $_POST['id_ibadah'];
$jenis_musibah = mysqli_real_escape_string($koneksi, $_POST['jenis_musibah']);
$deskripsi = mysqli_real_escape_string($koneksi, $_POST['deskripsi']);

// Status penanganan otomatis diatur ke 'Menunggu Bantuan' oleh database sesuai skema
$query = "INSERT INTO laporan_musibah (id_penduduk, id_ibadah, jenis_musibah, deskripsi) 
          VALUES ('$id_penduduk', '$id_ibadah', '$jenis_musibah', '$deskripsi')";

if(mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'pesan' => mysqli_error($koneksi)]);
}
?>