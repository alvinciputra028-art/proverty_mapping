<?php
include "../../config/koneksi.php";

// Mengambil pelatihan yang masih aktif (belum melewati tanggal selesai)
$query = mysqli_query($koneksi, "SELECT * FROM master_pelatihan WHERE tanggal_selesai >= CURDATE() ORDER BY id DESC");
$data = [];
if($query){
    while($row = mysqli_fetch_assoc($query)){ 
        $data[] = $row; 
    }
}
header('Content-Type: application/json');
echo json_encode($data);
?>