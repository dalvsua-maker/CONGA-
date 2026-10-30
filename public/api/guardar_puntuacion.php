<?php

/**
 * POST api/guardar_puntuacion.php
 * Guarda una partida a partir de un JSON con name, score y duration.
 */

use MongoDB\BSON\UTCDateTime;

require_once __DIR__ . '/../../src/BaseDeDatos.php';
require_once __DIR__ . '/../../src/Validador.php';
require_once __DIR__ . '/../../src/Respuesta.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Respuesta::error(405, 'METODO_NO_PERMITIDO');
}

/* Si el JSON no es válido queda un array vacío y falla en el nombre */
$cuerpo = json_decode(file_get_contents('php://input'), true);

if (!is_array($cuerpo)) {
    $cuerpo = [];
}

$nombre = Respuesta::exigir(Validador::nombre($cuerpo['name'] ?? null), 'NOMBRE_INVALIDO');
$puntuacion = Respuesta::exigir(Validador::puntuacion($cuerpo['score'] ?? null), 'PUNTUACION_INVALIDA');
$duracion = Respuesta::exigir(Validador::duracion($cuerpo['duration'] ?? null), 'DURACION_INVALIDA');

/* nameKey es el nombre en minúsculas, sirve para agrupar y buscar al jugador */
try {
    BaseDeDatos::puntuaciones()->insertOne([
        'name'      => $nombre,
        'nameKey'   => Validador::claveNombre($nombre),
        'score'     => $puntuacion,
        'createdAt' => new UTCDateTime(),
        'duration'  => $duracion,
    ]);
} catch (Throwable $e) {
    Respuesta::baseDeDatosNoDisponible('guardar_puntuacion', $e);
}

Respuesta::json(201, ['ok' => true]);
