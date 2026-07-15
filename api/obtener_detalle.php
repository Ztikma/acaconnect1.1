<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$servername = "127.0.0.1"; 
$username = "u240421253_oswaldo"; 
$password = "Crash3632";          
$dbname = "u240421253_cursos";    

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["error" => "Error de conexión"]);
    exit;
}
$conn->set_charset("utf8mb4");

$id_curso = isset($_GET['id']) ? intval($_GET['id']) : 1;

$sql = "SELECT c.id_curso, c.titulo, c.acerca_de, c.precio, c.duracion_horas, c.nivel, c.imagen_url, 
               u.nombre AS maestro_nombre, u.apellido_paterno AS maestro_paterno 
        FROM cursos c 
        LEFT JOIN usuarios u ON c.id_maestro = u.id_usuario 
        WHERE c.id_curso = $id_curso";
        
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    echo json_encode($result->fetch_assoc());
} else {
    echo json_encode(["error" => "Curso no encontrado"]);
}
$conn->close();
?>