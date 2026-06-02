<?php
include "../../config/koneksi.php";
include "../../config/check_session.php";

$nama_kk = $_POST['nama_kk'];
$agama = $_POST['agama'];
$tanggungan = $_POST['tanggungan'];
$pengeluaran = $_POST ['pengeluaran'];
$lantai = $_POST ['lantai'];
$dinding = $_POST ['dinding'];
$sanitasi = $_POST ['sanitasi'];
$listrik = $_POST ['listrik'];
$air = $_POST ['air'];
$skor_aset = $_POST ['skor_aset'];
$status = $_POST ['status_kemiskinan'];
$alamat = $_POST['alamat'];
$lat = $_POST['latitude']; 
$lng = $_POST['longitude'];

$query = "INSERT INTO penduduk_miskin (nama_kk, agama, tanggungan, pengeluaran, lantai, dinding, sanitasi, listrik, air, skor_aset, status_kemiskinan, alamat, latitude, longitude) 
          VALUES ('$nama_kk', '$agama', '$tanggungan', '$pengeluaran', '$lantai', '$dinding', '$sanitasi', '$listrik', '$air', '$skor_aset', '$status', '$alamat', '$lat', '$lng')";
echo json_encode(['status' => mysqli_query($koneksi, $query) ? 'success' : 'error']);
?>