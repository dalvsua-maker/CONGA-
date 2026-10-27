<?php

/**
 * GET api/maximo.php?name=...
 * Devuelve la mejor puntuación del jugador (0 si todavía no ha jugado).
 */

require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/Validador.php';
require_once __DIR__ . '/../../src/Respuesta.php';

/* El nombre llega por la URL y se valida igual que al guardar */
$nombre = Validador::nombre($_GET['name'] ?? null);
if ($nombre === null) {
    Respuesta::json(400, ['ok' => false, 'error' => 'NOMBRE_INVALIDO']);
}

/* Ordenado por score descendente, el primero es su mejor partida */
try {
    $mejor = Database::scores()->findOne(
        ['nameKey' => Validador::claveNombre($nombre)],
        ['sort' => ['score' => -1], 'projection' => ['_id' => 0, 'score' => 1]]
    );
} catch (Throwable $e) {
    error_log('maximo: ' . $e->getMessage());
    Respuesta::json(503, ['ok' => false, 'error' => 'BD_NO_DISPONIBLE']);
}

$maximo = $mejor === null ? 0 : $mejor['score'];

Respuesta::json(200, ['ok' => true, 'maximo' => $maximo]);
