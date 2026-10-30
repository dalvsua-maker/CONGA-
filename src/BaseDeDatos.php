<?php

use MongoDB\Client;
use MongoDB\Collection;

require_once __DIR__ . '/../vendor/autoload.php';

/** La única clase que habla con Atlas: el resto pide la colección con BaseDeDatos::puntuaciones() */
class BaseDeDatos
{
    /** Cliente de Mongo, null hasta que se conecta */
    private static ?Client $cliente = null;

    /** Nombre de la base de datos */
    private static string $nombreBd = '';

    /** Crea el cliente la primera vez que hace falta (la conexión real ocurre en la primera consulta) */
    private static function conectar(): void
    {
        if (self::$cliente !== null) {
            return;
        }

        $config = require __DIR__ . '/config.php';

        self::$cliente = new Client($config['uri'], [
            'serverSelectionTimeoutMS' => 5000,
        ]);
        self::$nombreBd = $config['db'];
    }

    /**
     * Colección `scores`: cada documento es una partida.
     *
     * @return Collection
     */
    public static function puntuaciones(): Collection
    {
        self::conectar();

        return self::$cliente->selectCollection(self::$nombreBd, 'scores');
    }
}
