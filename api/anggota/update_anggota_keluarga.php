<?php
include "../../config/koneksi.php";

$id_anggota = $_POST['id_anggota'];
$nik = mysqli_real_escape_string($koneksi, $_POST['nik']);
$nama_lengkap = mysqli_real_escape_string($koneksi, $_POST['nama_lengkap']);
$tanggal_lahir = $_POST['tanggal_lahir'];
$pendidikan_terakhir = mysqli_real_escape_string($koneksi, $_POST['pendidikan_terakhir']);
$pekerjaan = mysqli_real_escape_string($koneksi, $_POST['pekerjaan']);

$query = "UPDATE anggota_keluarga SET 
            nik = '$nik', 
            nama_lengkap = '$nama_lengkap', 
            tanggal_lahir = '$tanggal_lahir', 
            pendidikan_terakhir = '$pendidikan_terakhir', 
            pekerjaan = '$pekerjaan' 
          WHERE id = '$id_anggota'";

if(mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'pesan' => mysqli_error($koneksi)]);
}
?>