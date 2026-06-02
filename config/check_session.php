<?php
session_start();

// timeout session (30 menit)
$timeout = 1800;

if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout)) {
    session_unset();
    session_destroy();
    header("Location: auth/login.php?error=3");
    exit;
}

$_SESSION['last_activity'] = time();

// cek login
if (!isset($_SESSION['id'])) {
    header("Location: auth/login.php?error=3");
    exit;
}
?>