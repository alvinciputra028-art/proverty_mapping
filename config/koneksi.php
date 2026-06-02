<?php
$koneksi = mysqli_connect("localhost", "root", "", "webgis");

if (!$koneksi) {
    die("Koneksi gagal: " . mysqli_connect_error());
}
?>