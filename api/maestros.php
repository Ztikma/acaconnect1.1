<?php
// api/maestros.php
require_once 'conexion.php';
try {
    // Filtramos los usuarios cuyo rol sea 'maestro'
    $stmt = $conn->prepare("SELECT id_usuario, nombre, apellido_paterno FROM usuarios WHERE rol = 'maestro'");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>