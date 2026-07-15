<?php
// api/usuarios.php
require_once 'conexion.php';
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'GET' && !$action) {
    try {
        $stmt = $conn->prepare("SELECT id_usuario, nombre, email, rol FROM usuarios");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method === 'POST' && $action === 'cambiar-rol') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data['id_usuario']) && !empty($data['rol'])) {
        try {
            $stmt = $conn->prepare("UPDATE usuarios SET rol = :rol WHERE id_usuario = :id_usuario");
            $stmt->execute([
                ':rol' => $data['rol'],
                ':id_usuario' => $data['id_usuario']
            ]);
            echo json_encode(["message" => "Rol actualizado"]);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
?>