<?php
// api/categorias.php
require_once 'conexion.php';
try {
    $stmt = $conn->prepare("SELECT id_categoria, nombre, descripcion FROM categorias");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>