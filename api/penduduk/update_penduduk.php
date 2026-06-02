<?php
include "../../config/koneksi.php";
include "../../config/check_session.php";

$id = $_POST["id"];
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

$query = "UPDATE penduduk_miskin SET nama_kk='$nama_kk', agama='$agama', tanggungan='$tanggungan', pengeluaran='$pengeluaran', lantai='$lantai', dinding='$dinding', sanitasi='$sanitasi', listrik='$listrik', air='$air', skor_aset='$skor_aset', status_kemiskinan='$status', alamat='$alamat' WHERE id='$id'";
if(mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($koneksi)]);
}
?>