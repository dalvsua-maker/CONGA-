<?php

use MongoDB\BSON\UTCDateTime;

require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Validador.php';
require_once __DIR__ . '/../../src/Respuesta.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Respuesta::json(405, ['ok' => false, 'error' => 'METODO_NO_PERMITIDO']);
}
$datos = json_decode(file_get_contents('php://input'), true);

if (!is_array($datos)) {
    $datos = [];
}

$nombre = Validador::nombre($datos['name'] ?? null);
if ($nombre === null) {
    Respuesta::json(400, ['ok' => false, 'error' => 'NOMBRE_INVALIDO']);
}

$puntuacion = Validador::puntuacion($datos['score'] ?? null);
if ($puntuacion === null) {
    Respuesta::json(400, ['ok' => false, 'error' => 'PUNTUACION_INVALIDA']);
}
$duracion = Validador::duracion($datos['duration'] ?? null);
if ($duracion === null) {
    Respuesta::json(400, ['ok' => false, 'error' => 'DURACION_INVALIDA']);
}
try {
    Database::scores()->insertOne([
        'name'      => $nombre,
        'nameKey'   => Validador::claveNombre($nombre),
        'score'     => $puntuacion,
        'createdAt' => new UTCDateTime(),      
        'duration'  => $duracion,
    ]);
    
} catch (Throwable $e) {
    error_log('guardar_puntuacion: ' . $e->getMessage());
    Respuesta::json(503, ['ok' => false, 'error' => 'BD_NO_DISPONIBLE']);
}

Respuesta::json(201, ['ok' => true]);