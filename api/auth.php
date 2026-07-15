<?php
// api/auth.php
require_once 'conexion.php';
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Lee los datos tanto si vienen en JSON plano como si vienen vacíos
$data = json_decode(file_get_contents("php://input"), true);

if ($action === 'registro') {
    if (!empty($data['nombre']) && !empty($data['email']) && !empty($data['contrasena'])) {
        try {
            $query = "INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, contraseña, rol, activo) 
                      VALUES (:nombre, :apellido_paterno, :apellido_materno, :email, :contrasena, 'alumno', 1)";
            $stmt = $conn->prepare($query);
            $stmt->execute([
                ':nombre' => $data['nombre'],
                ':apellido_paterno' => $data['apellido_paterno'],
                ':apellido_materno' => $data['apellido_materno'],
                ':email' => $data['email'],
                ':contrasena' => $data['contrasena'] 
            ]);
            echo json_encode(["message" => "Cuenta creada con éxito"]);
        } catch (Exception $e) {
            echo json_encode(["error" => "El correo ya está registrado o hubo un error."]);
        }
    }
}

if ($action === 'login') {
    // Detectamos si los datos vinieron por FormData ($_POST) o por JSON ($data)
    $email = isset($_POST['email']) ? trim($_POST['email']) : ($data['email'] ?? '');
    $contrasena = isset($_POST['contrasena']) ? $_POST['contrasena'] : ($data['contrasena'] ?? '');

    if (!empty($email) && !empty($contrasena)) {
        try {
            // Nota: Usamos 'contraseña' con eñe que es el nombre real de tu columna en la BD
            $query = "SELECT id_usuario, nombre, email, rol, contraseña FROM usuarios WHERE email = :email";
            $stmt = $conn->prepare($query);
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && $user['contraseña'] === $contrasena) {
                echo json_encode([
                    "usuario" => [
                        "id" => $user['id_usuario'],
                        "nombre" => $user['nombre'],
                        "email" => $user['email'],
                        "rol" => $user['rol']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Credenciales incorrectas"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Datos de inicio de sesión incompletos."]);
    }
}
?>