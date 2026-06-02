<?php
include "../../config/koneksi.php";
include "../../config/check_session.php";

$id = $_POST['id'];
$nama = $_POST['nama'];
$jenis = $_POST['jenis'];
$radius = $_POST['radius'];
$alamat = $_POST['alamat'];

$query = "UPDATE tempat_ibadah SET nama='$nama', jenis='$jenis', radius='$radius', alamat='$alamat' WHERE id='$id'";
if(mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($koneksi)]);
}
?>