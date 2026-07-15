<?php
// api/cursos.php
require_once 'conexion.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. OBTENER CURSOS (GET)
if ($method === 'GET' && !$action) {
    try {
        $query = "SELECT * FROM cursos";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $cursos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($cursos);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
}

// 2. CREAR CURSO (POST)
if ($method === 'POST' && $action === 'crear') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data['titulo'])) {
        try {
            $query = "INSERT INTO cursos (titulo, descripcion_corta, acerca_de, precio, duracion_horas, nivel, id_maestro, id_categoria, imagen_url) 
                      VALUES (:titulo, :descripcion_corta, :acerca_de, :precio, :duracion_horas, :nivel, :id_maestro, :id_categoria, :imagen_url)";
            $stmt = $conn->prepare($query);
            $stmt->execute([
                ':titulo' => $data['titulo'],
                ':descripcion_corta' => $data['descripcion_corta'] ?? null,
                ':acerca_de' => $data['acerca_de'] ?? null,
                ':precio' => $data['precio'],
                ':duracion_horas' => $data['duracion_horas'] ?? null,
                ':nivel' => $data['nivel'] ?? null,
                ':id_maestro' => $data['id_maestro'] ?? null,
                ':id_categoria' => $data['id_categoria'] ?? null,
                ':imagen_url' => $data['imagen_url'] ?? null
            ]);
            echo json_encode(["message" => "Curso creado con éxito"]);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["error" => "Datos incompletos"]);
    }
}

// 3. ACTUALIZAR CURSO (PUT o POST simulado para actualización)
if (($method === 'PUT' || $method === 'POST') && $action === 'actualizar') {
    $id_curso = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if ($id_curso > 0 && !empty($data['titulo'])) {
        try {
            $query = "UPDATE cursos SET titulo = :titulo, descripcion_corta = :descripcion_corta, acerca_de = :acerca_de, 
                      precio = :precio, duracion_horas = :duracion_horas, nivel = :nivel, id_maestro = :id_maestro, 
                      id_categoria = :id_categoria, imagen_url = :imagen_url WHERE id_curso = :id_curso";
            $stmt = $conn->prepare($query);
            $stmt->execute([
                ':titulo' => $data['titulo'],
                ':descripcion_corta' => $data['descripcion_corta'] ?? null,
                ':acerca_de' => $data['acerca_de'] ?? null,
                ':precio' => $data['precio'],
                ':duracion_horas' => $data['duracion_horas'] ?? null,
                ':nivel' => $data['nivel'] ?? null,
                ':id_maestro' => $data['id_maestro'] ?? null,
                ':id_categoria' => $data['id_categoria'] ?? null,
                ':imagen_url' => $data['imagen_url'] ?? null,
                ':id_curso' => $id_curso
            ]);
            echo json_encode(["message" => "Curso actualizado con éxito"]);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["error" => "Faltan parámetros válidos"]);
    }
}

// 4. ELIMINAR CURSO (DELETE)
if (($method === 'DELETE' || $method === 'POST') && $action === 'eliminar') {
    $id_curso = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id_curso > 0) {
        try {
            $query = "DELETE FROM cursos WHERE id_curso = :id_curso";
            $stmt = $conn->prepare($query);
            $stmt->execute([':id_curso' => $id_curso]);
            echo json_encode(["message" => "Curso eliminado de forma permanente"]);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        echo json_encode(["error" => "ID inválido"]);
    }
}
?>