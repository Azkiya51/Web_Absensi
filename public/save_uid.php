<?php
// Pastikan file koneksi.php berisi detail koneksi database (variabel $conn)
include "koneksi.php"; 

// --- 1. Ambil dan Sanitasi Input ---
// Ambil UID, pastikan selalu diubah ke huruf besar
$uid = strtoupper($_GET['uid'] ?? '');
$tanggal = date("Y-m-d");
$id_matkul = 1; // ID Mata Kuliah: HARDCODE, GANTI dengan logika dinamis jika diperlukan

// Set header response
header('Content-Type: text/plain');

if (empty($uid)) {
    echo "Error: UID kosong.";
    exit;
}

// --- 2. Cari Mahasiswa Berdasarkan UID (Prepared Statement) ---
$sql_select = "SELECT id_mahasiswa FROM mahasiswa WHERE uid = ?";
$stmt_select = $conn->prepare($sql_select);

if (!$stmt_select) {
    // Error saat prepare statement
    echo "Error Prepared Select: " . $conn->error;
    exit;
}

$stmt_select->bind_param("s", $uid); // "s" untuk string
$stmt_select->execute();
$result = $stmt_select->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $id_mahasiswa = $row['id_mahasiswa'];
    
    // --- 3. Cek Absensi Hari Ini (Prepared Statement) ---
    $sql_check = "SELECT id_absensi FROM absensi WHERE id_mahasiswa = ? AND id_matkul = ? AND tanggal = ?";
    $stmt_check = $conn->prepare($sql_check);
    
    if (!$stmt_check) {
        echo "Error Prepared Check: " . $conn->error;
        $stmt_select->close();
        exit;
    }
    
    $stmt_check->bind_param("iis", $id_mahasiswa, $id_matkul, $tanggal); // i=integer, s=string
    $stmt_check->execute();
    $resCheck = $stmt_check->get_result();
    
    if ($resCheck->num_rows > 0) {
        // --- 4a. Absensi Sudah Ada: Update Waktu (Prepared Statement) ---
        $sqlUpdate = "UPDATE absensi SET waktu=NOW(), status=1 WHERE id_mahasiswa = ? AND id_matkul = ? AND tanggal = ?";
        $stmt_update = $conn->prepare($sqlUpdate);
        
        if ($stmt_update) {
            $stmt_update->bind_param("iis", $id_mahasiswa, $id_matkul, $tanggal);
            if ($stmt_update->execute()) {
                echo "Absensi diperbarui";
            } else {
                echo "Error Update: " . $stmt_update->error;
            }
            $stmt_update->close();
        } else {
            echo "Error Prepared Update: " . $conn->error;
        }
        
    } else {
        // --- 4b. Absensi Baru: Insert Baru (Prepared Statement) ---
        $sqlInsert = "INSERT INTO absensi (id_mahasiswa, id_matkul, tanggal, waktu, status) VALUES (?, ?, ?, NOW(), 1)";
        $stmt_insert = $conn->prepare($sqlInsert);
        
        if ($stmt_insert) {
            $stmt_insert->bind_param("iis", $id_mahasiswa, $id_matkul, $tanggal);
            if ($stmt_insert->execute()) {
                echo "Absensi dicatat";
            } else {
                echo "Error Insert: " . $stmt_insert->error;
            }
            $stmt_insert->close();
        } else {
            echo "Error Prepared Insert: " . $conn->error;
        }
    }
    
    $stmt_check->close();
    
} else {
    // --- 5. UID Tidak Terdaftar ---
    echo "UID tidak terdaftar";
}

// Tutup statement select utama
$stmt_select->close();

// Tutup koneksi database
$conn->close();
?>