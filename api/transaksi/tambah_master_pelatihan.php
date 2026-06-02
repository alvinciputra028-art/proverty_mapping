<?php
include "../../config/koneksi.php";

$nama_pelatihan = mysqli_real_escape_string($koneksi, $_POST['nama_pelatihan']);
$penyelenggara = mysqli_real_escape_string($koneksi, $_POST['penyelenggara']);
$tanggal_mulai = $_POST['tanggal_mulai'];
$tanggal_selesai = $_POST['tanggal_selesai'];
$deskripsi = mysqli_real_escape_string($koneksi, $_POST['deskripsi']);

$query = "INSERT INTO master_pelatihan (nama_pelatihan, penyelenggara, tanggal_mulai, tanggal_selesai, deskripsi) 
          VALUES ('$nama_pelatihan', '$penyelenggara', '$tanggal_mulai', '$tanggal_selesai', '$deskripsi')";

if(mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'pesan' => mysqli_error($koneksi)]);
}
?>