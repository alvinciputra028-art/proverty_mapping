<?php
include "../../config/koneksi.php";

$id_anggota = $_POST['id_anggota'];
$id_pelatihan = $_POST['id_pelatihan'];

// Validasi Anti-Duplikasi: Cek apakah sudah pernah didaftarkan ke pelatihan ini
$cek = mysqli_query($koneksi, "SELECT id FROM log_pelatihan WHERE id_anggota='$id_anggota' AND id_pelatihan='$id_pelatihan'");
if(mysqli_num_rows($cek) > 0){
     echo json_encode(['status' => 'error', 'pesan' => 'Anggota ini sudah terdaftar di program pelatihan tersebut!']);
     exit;
}

$query = "INSERT INTO log_pelatihan (id_anggota, id_pelatihan, status_kelulusan) 
          VALUES ('$id_anggota', '$id_pelatihan', 'Sedang Berjalan')";

if(mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error']);
}
?>