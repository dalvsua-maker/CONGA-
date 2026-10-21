<?php

use MongoDB\Client;
use MongoDB\Collection;

require_once __DIR__ . '/../vendor/autoload.php';
class Database
{
    private static ?Client $client = null;
    private static string $dbName = '';

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
        public static function scores(): Collection
    {
        self::connect();

        return self::$client->selectCollection(self::$dbName, 'scores');
    }
}