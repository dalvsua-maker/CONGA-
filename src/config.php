<?php

$uri = getenv('MONGODB_URI');
$db  = getenv('MONGODB_DB');
if ($uri === false || $uri === '' || $db === false || $db === '') {
    throw new RuntimeException('Falta configuración de MongoDB en el entorno.');
}
return [
    'uri' => $uri,
    'db'  => $db,
];