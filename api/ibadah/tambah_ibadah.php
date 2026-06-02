<?php
include "../../config/koneksi.php";
include "../../config/check_session.php";

$nama = $_POST['nama']; $jenis = $_POST['jenis']; 
$radius = $_POST['radius']; $alamat = $_POST['alamat'];
$lat = $_POST['latitude']; $lng = $_POST['longitude'];

$query = "INSERT INTO tempat_ibadah (nama, jenis, radius, alamat, latitude, longitude) 
          VALUES ('$nama', '$jenis', '$radius', '$alamat', '$lat', '$lng')";
echo json_encode(['status' => mysqli_query($koneksi, $query) ? 'success' : 'error']);
?>