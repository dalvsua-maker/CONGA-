<?php

class Validador
{
    public const MAX_PUNTUACION = 4000;
        public const MAX_DURACION = 86400;
        public static function nombre(mixed $valor): ?string
    {
        if (!is_string($valor)) {
            return null;
        }

        $nombre = trim($valor);

        if (!preg_match('/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]{3,15}$/u', $nombre)) {
            return null;
        }

        return $nombre;
    }
        public static function puntuacion(mixed $valor): ?int
    {
        if (!is_int($valor) || $valor < 0 || $valor > self::MAX_PUNTUACION) {
            return null;
        }

        return $valor;
    }
        public static function duracion(mixed $valor): ?int
    {
        if (!is_int($valor) || $valor < 0 || $valor > self::MAX_DURACION) {
            return null;
        }

        return $valor;
    }

    public static function claveNombre(string $nombre): string
    {
        return mb_strtolower($nombre, 'UTF-8');
    }
}