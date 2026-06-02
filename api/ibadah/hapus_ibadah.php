<?php
include "../../config/koneksi.php";
include "../../config/check_session.php";

$id = $_GET['id'];
$query = "DELETE FROM tempat_ibadah WHERE id = '$id'";

if(mysqli_query($koneksi, $query)) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error']);
}
?>