<?php

/**
 * GET api/ranking.php
 * Devuelve el top 10 con una fila por jugador (su mejor partida).
 */

require_once __DIR__ . '/../../src/BaseDeDatos.php';
require_once __DIR__ . '/../../src/Respuesta.php';

/* Se ordena, se agrupa por jugador, se vuelve a ordenar (al agrupar se pierde
   el orden) y se corta en 10 */
$pipeline = [
    ['$sort' => ['score' => -1, 'createdAt' => 1]],
    ['$group' => [
        '_id'       => '$nameKey',
        'name'      => ['$first' => '$name'],
        'score'     => ['$first' => '$score'],
        'createdAt' => ['$first' => '$createdAt'],
    ]],
    ['$sort' => ['score' => -1, 'createdAt' => 1]],
    ['$limit' => 10],
    ['$project' => ['_id' => 0, 'name' => 1, 'score' => 1]],
];

try {
    $ranking = [];

    foreach (BaseDeDatos::puntuaciones()->aggregate($pipeline) as $fila) {
        $ranking[] = [
            'name'  => $fila['name'],
            'score' => $fila['score'],
        ];
    }
} catch (Throwable $e) {
    Respuesta::baseDeDatosNoDisponible('ranking', $e);
}

Respuesta::json(200, ['ok' => true, 'ranking' => $ranking]);
