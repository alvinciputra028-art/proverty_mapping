<?php
include "../../config/koneksi.php";
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if (mysqli_query($koneksi, "DELETE FROM anggota_keluarga WHERE id = '$id'")) {
    echo json_encode(['status' => 'success']);
    mysqli_query($koneksi, "UPDATE penduduk_miskin SET tanggungan = (SELECT COUNT(id) FROM anggota_keluarga WHERE id_penduduk = '$id_penduduk') WHERE id = '$id_penduduk'");
} else {
    echo json_encode(['status' => 'error']);
}
?>