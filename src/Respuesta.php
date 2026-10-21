<?php

class Respuesta
{
    public static function json(int $codigo, array $cuerpo): never
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
        exit;
    }
}