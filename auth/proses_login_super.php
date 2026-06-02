<?php
session_start();
include '../config/koneksi.php';

$username = $_POST['username'];
$password = $_POST['password'];

$stmt = mysqli_prepare($koneksi, "SELECT * FROM super_admin WHERE username = ?");
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$data = mysqli_fetch_assoc($result);

if ($data) {
    if (password_verify($password, $data['password'])) {

        $_SESSION['id'] = $data['id'];
        $_SESSION['nama'] = $data['nama_lengkap'];
        $_SESSION['role'] = 'superadmin';

        header("Location: ../index_super.php");
        exit;
    } else {
        header("Location: login_super.php?error=1");
        exit;
    }
}

mysqli_stmt_close($stmt);

header("Location: login_super.php?error=2");
exit;
?>