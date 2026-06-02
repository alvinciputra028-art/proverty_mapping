<?php
include "../../config/koneksi.php";

if(isset($_GET['id_penduduk'])) {
    $id_penduduk = $_GET['id_penduduk'];
    
    $query = 
        "SELECT tanggal_penyaluran, beras_kg, minyak_l, gula_kg, telur_kg, susu_kaleng, uang_tunai, catatan, created_at
        FROM log_bantuan 
        WHERE id_penduduk = '$id_penduduk' 
        ORDER BY created_at DESC";
              
    $result = mysqli_query($koneksi, $query);
    $data = array();
    
    if($result) {
        while($row = mysqli_fetch_assoc($result)) {
            $row['tanggal_penyaluran'] = date("d/m/Y", strtotime($row['tanggal_penyaluran']));
            $data[] = $row;
        }
    }
    
    echo json_encode($data);
}
?>