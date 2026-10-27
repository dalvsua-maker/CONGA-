<?php

use MongoDB\Client;
use MongoDB\Collection;

require_once __DIR__ . '/../vendor/autoload.php';

/** La única clase que habla con Atlas: el resto pide la colección con Database::scores() */
class Database
{
    /** Cliente de Mongo, null hasta que se conecta */
    private static ?Client $client = null;

    /** Nombre de la base de datos */
    private static string $dbName = '';

    /** Crea el cliente la primera vez que hace falta (la conexión real ocurre en la primera consulta) */
    private static function connect(): void
    {
        if (self::$client !== null) {
            return;
        }

        $config = require __DIR__ . '/config.php';

        self::$client = new Client($config['uri'], [
            'serverSelectionTimeoutMS' => 5000,
        ]);
        self::$dbName = $config['db'];
    }

    /**
     * Colección `scores`: cada documento es una partida.
     *
     * @return Collection
     */
    public static function scores(): Collection
    {
        self::connect();

        return self::$client->selectCollection(self::$dbName, 'scores');
    }
}
