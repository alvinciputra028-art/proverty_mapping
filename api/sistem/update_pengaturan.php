<?php
include "../../config/koneksi.php";
include "../../config/check_session.php";

$gk = (int) $_POST['garis_kemiskinan'];
mysqli_query($koneksi, "UPDATE pengaturan SET garis_kemiskinan = '$gk' WHERE id = 1");
echo json_encode(['status' => 'success']);
?>