<?php

/**
 * GET api/maximo.php?name=...
 * Devuelve la mejor puntuación del jugador (0 si todavía no ha jugado).
 */

require_once __DIR__ . '/../../src/BaseDeDatos.php';
require_once __DIR__ . '/../../src/Validador.php';
require_once __DIR__ . '/../../src/Respuesta.php';

/* El nombre llega por la URL y se valida igual que al guardar */
$nombre = Respuesta::exigir(Validador::nombre($_GET['name'] ?? null), 'NOMBRE_INVALIDO');

/* Ordenado por score descendente, el primero es su mejor partida */
try {
    $mejor = BaseDeDatos::puntuaciones()->findOne(
        ['nameKey' => Validador::claveNombre($nombre)],
        ['sort' => ['score' => -1], 'projection' => ['_id' => 0, 'score' => 1]]
    );
} catch (Throwable $e) {
    Respuesta::baseDeDatosNoDisponible('maximo', $e);
}

$maximo = $mejor === null ? 0 : $mejor['score'];

Respuesta::json(200, ['ok' => true, 'maximo' => $maximo]);
