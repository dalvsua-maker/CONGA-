<?php

/** Reglas del contrato. Cada método devuelve el valor limpio, o null si no vale. */
class Validador
{
    /** Máximo posible: 397 bolas x 10 puntos = 3970, así que 4000 ya es imposible. */
    public const MAX_PUNTUACION = 4000;

    /** 24 horas en segundos, solo para descartar valores absurdos. */
    public const MAX_DURACION = 86400;

    /**
     * Nombre de 3 a 15 caracteres: letras, números, tildes y espacios.
     *
     * @param mixed $valor
     * @return string|null
     */
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

    /**
     * Entero entre 0 y MAX_PUNTUACION.
     *
     * @param mixed $valor
     * @return int|null
     */
    public static function puntuacion(mixed $valor): ?int
    {
        if (!is_int($valor) || $valor < 0 || $valor > self::MAX_PUNTUACION) {
            return null;
        }

        return $valor;
    }

    /**
     * Entero (segundos) entre 0 y MAX_DURACION.
     *
     * @param mixed $valor
     * @return int|null
     */
    public static function duracion(mixed $valor): ?int
    {
        if (!is_int($valor) || $valor < 0 || $valor > self::MAX_DURACION) {
            return null;
        }

        return $valor;
    }

    /**
     * Nombre en minúsculas, para que Ana y ana sean el mismo jugador.
     *
     * @param string $nombre
     * @return string
     */
    public static function claveNombre(string $nombre): string
    {
        return mb_strtolower($nombre, 'UTF-8');
    }
}
