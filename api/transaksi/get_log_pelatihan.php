<?php
include "../../config/koneksi.php";

$id_penduduk = isset($_GET['id_penduduk']) ? (int)$_GET['id_penduduk'] : 0;

// Query JOIN untuk mengambil data log pelatihan beserta nama anggota dan detail pelatihannya
$query = "SELECT 
            ak.nama_lengkap, 
            mp.nama_pelatihan, 
            mp.penyelenggara, 
            lp.tanggal_daftar, 
            lp.status_kelulusan 
          FROM log_pelatihan lp
          JOIN anggota_keluarga ak ON lp.id_anggota = ak.id
          JOIN master_pelatihan mp ON lp.id_pelatihan = mp.id
          WHERE ak.id_penduduk = '$id_penduduk'
          ORDER BY lp.tanggal_daftar DESC";

$result = mysqli_query($koneksi, $query);
$data = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        // Format tanggal agar lebih mudah dibaca (opsional)
        $row['tanggal_daftar'] = date('d-m-Y', strtotime($row['tanggal_daftar']));
        $data[] = $row;
    }
}

header('Content-Type: application/json');
echo json_encode($data);
?>