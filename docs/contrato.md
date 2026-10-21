# CONGA! — Fase 2: Contrato JS–PHP

## Reglas comunes
- Formato JSON en respuestas y en el cuerpo del POST (PHP lee `php://input`).
- Toda respuesta lleva `ok` (true/false). Si es false, lleva `error` con un código fijo.
- Mismo origen: no hace falta CORS (la página y la API se sirven desde el mismo dominio, tanto en local como en Render).
- Errores de Atlas: PHP devuelve solo `BD_NO_DISPONIBLE`; el detalle va al log del servidor.

## Operación 1 · Guardar puntuación
`POST api/guardar_puntuacion.php` — cuerpo: `{"name": "Dani", "score": 50, "duration": 95}`

| Caso | HTTP | Respuesta |
|---|---|---|
| Guardada | 201 | `{"ok": true}` |
| Nombre inválido (RF-06) | 400 | `{"ok": false, "error": "NOMBRE_INVALIDO"}` |
| Puntuación inválida (RF-09) | 400 | `{"ok": false, "error": "PUNTUACION_INVALIDA"}` |
| Duración inválida | 400 | `{"ok": false, "error": "DURACION_INVALIDA"}` |
| Método distinto de POST | 405 | `{"ok": false, "error": "METODO_NO_PERMITIDO"}` |
| Atlas falla (RNF-04) | 503 | `{"ok": false, "error": "BD_NO_DISPONIBLE"}` |

- PHP recorta espacios del nombre, valida (en este orden: nombre, puntuación, duración), calcula `nameKey` con `mb_strtolower` y guarda `createdAt`.
- `score` debe ser entero JSON (no texto), ≥ 0 y no superar `Validador::MAX_PUNTUACION` (4000).
- `duration` es la duración de la partida en **segundos**: entero JSON (no texto), ≥ 0 y no superar `Validador::MAX_DURACION` (86400, 24 h).
- Limitación aceptada: sin registro, una puntuación o duración falsas enviadas a mano son posibles; los topes reducen el abuso.

## Operación 2 · Obtener ranking
`GET api/ranking.php`

| Caso | HTTP | Respuesta |
|---|---|---|
| Correcto | 200 | `{"ok": true, "ranking": [{"name": "Marta", "score": 340}, ...]}` |
| Atlas falla | 503 | `{"ok": false, "error": "BD_NO_DISPONIBLE"}` |

- Máximo 10 entradas, orden descendente, un jugador por entrada (agrupado por `nameKey`).
- Sin partidas: `"ranking": []` (caso válido).
- Empates: gana quien llegó antes (`createdAt`).

## Operación 3 · Obtener máximo histórico
`GET api/maximo.php?name=Dani` (el JS usa `encodeURIComponent`)

| Caso | HTTP | Respuesta |
|---|---|---|
| Correcto | 200 | `{"ok": true, "maximo": 120}` |
| Jugador sin partidas | 200 | `{"ok": true, "maximo": 0}` |
| Nombre inválido | 400 | `{"ok": false, "error": "NOMBRE_INVALIDO"}` |
| Atlas falla | 503 | `{"ok": false, "error": "BD_NO_DISPONIBLE"}` |

- Misma validación de nombre que la operación 1 (`Validador.php`).

## Orden de llamadas desde el JS
- Game over: 1) `guardar_puntuacion`; 2) después, `ranking` y `maximo` en paralelo e independientes (si una falla, la otra se muestra y se avisa de la que falló).
- Inicio: solo `maximo`. Al empezar una partida: `maximo` para mostrar el récord en vivo.

## Notas de producción
- El JS corta cada petición a los 8 segundos (`api.js`). Como la página y la API viven en el mismo servicio, el arranque en frío del plan gratuito de Render afecta a la primera carga de la página, no a las llamadas de la partida; solo podría cortarse una petición si el servicio se durmiera con el jugador parado en la pantalla de game over.

## Siguiente fase
Mantenimiento y mejora de la interfaz. El contrato no cambia salvo que se pidan nuevas funciones (por ejemplo, estadísticas con el campo `duration`).
