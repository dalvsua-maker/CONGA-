<?php

/** Responde en JSON y corta la ejecución, para no repetirlo en cada endpoint. */
class Respuesta
{
    /**
     * Envía el código HTTP y el cuerpo en JSON, y termina el script.
     *
     * @param int   $codigo Código HTTP.
     * @param array $cuerpo Datos de la respuesta.
     * @return never
     */
    public static function json(int $codigo, array $cuerpo): never
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
