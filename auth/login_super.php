<?php
session_start();

$error = "";

// jika sudah login, arahkan ke index
if (isset($_SESSION['id'])) {
    header("Location: ../index_super.php");
    exit;
}

// jika berhasil logout
if (isset($_GET['logout'])) {
    $error = "Anda berhasil logout!";
}

// ambil pesan error dari URL
if (isset($_GET['error'])) {
    if ($_GET['error'] == "1") {
        $error = "Password salah!";
    } elseif ($_GET['error'] == "2") {
        $error = "Akun tidak ditemukan!";
    } elseif ($_GET['error'] == "3") {
        $error = "Silakan login terlebih dahulu!";
    }
}
?>

<!DOCTYPE html>
<html>

<head>
    <title>Login Super Admin - WebGIS Proverty Mapping Kota Pontianak</title>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            background: white;
            width: 800px;
            border-radius: 15px;
            display: flex;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .brand {
            width: 40%;
            background: linear-gradient(135deg, #0EA2BD 0%, #086b7d 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            text-align: center;
        }

        .form {
            width: 60%;
            padding: 40px;
        }

        .form h3 {
            text-align: center;
            margin-top: 0;
            margin-bottom: 20px;
        }

        input,
        button,
        textarea {
            width: 100%;
            padding: 12px;
            margin-top: 5px;
            margin-bottom: 15px;
            border-radius: 8px;
            box-sizing: border-box;
        }

        input {
            border: 1px solid #ccc;
        }

        button {
            background: #0EA2BD;
            margin-bottom: 0px;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }

        label {
            font-weight: bold;
        }

        button:hover {
            background: #0c8ca3;
        }

        .error {
            color: red;
            text-align: center;
            margin-bottom: 15px;
        }

        .login-super {
            text-align: center; 
            margin-top: 20px; 
            border-top: 1px solid #eee; 
            padding-top: 15px;
        }

        .login-super a {
            color: #7f8c8d; 
            text-decoration: none; 
            font-size: 13px;
        }

        .login-super a:hover {
            color: #0c8ca3;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="brand">
            <h2>WebGIS Proverty Mapping Kota Pontianak</h2>
            <p>Panel Pengendali Utama - Super Admin</p>
        </div>

        <div class="form">
            <h3>Selamat Datang!</h3>
            <p>Silahkan login menggunakan akun Anda!</p>

            <?php if ($error != ""): ?>
                <div class="error"><?php echo $error; ?></div>
            <?php endif; ?>
            <br><br>

            <form method="POST" action="proses_login_super.php">
                <label>Username</label>
                <input type="text" name="username" placeholder="Masukkan username Anda" required>

                <label>Password</label>
                <input type="password" name="password" placeholder="Masukkan password Anda" required>

                <button type="submit">Login</button>

                <div class="login-super">
                    <a href="login.php">Login sebagai Admin Tempat Ibadah</a>
                </div>
            </form>
        </div>
    </div>
</body>

</html>