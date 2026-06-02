<?php
include "../../config/koneksi.php";

$id_penduduk = $_POST['id_penduduk'];
$nik = mysqli_real_escape_string($koneksi, $_POST['nik']);
$nama_lengkap = mysqli_real_escape_string($koneksi, $_POST['nama_lengkap']);
$tanggal_lahir = $_POST['tanggal_lahir'];
$pendidikan = mysqli_real_escape_string($koneksi, $_POST['pendidikan_terakhir']);
$pekerjaan = mysqli_real_escape_string($koneksi, $_POST['pekerjaan']);

$query = "INSERT INTO anggota_keluarga (id_penduduk, nik, nama_lengkap, tanggal_lahir, pendidikan_terakhir, pekerjaan) 
          VALUES ('$id_penduduk', '$nik', '$nama_lengkap', '$tanggal_lahir', '$pendidikan', '$pekerjaan')";

if (mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
    mysqli_query($koneksi, "UPDATE penduduk_miskin SET tanggungan = (SELECT COUNT(id) FROM anggota_keluarga WHERE id_penduduk = '$id_penduduk') WHERE id = '$id_penduduk'");
} else {
    echo json_encode(['status' => 'error', 'pesan' => mysqli_error($koneksi)]);
}
?>