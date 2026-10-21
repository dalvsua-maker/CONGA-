# CONGA! — Fase 2: Diseño

## Decisiones de diseño
- "Ana" y "ana" son el mismo jugador: se agrupa por `nameKey` (nombre en minúsculas).
- Se permite usar la librería oficial de MongoDB para PHP (extensión `mongodb` + Composer).
- Una sola página (`index.html`) con las tres pantallas.

## Notas de implementación
- Nuevo fichero `src/Respuesta.php`: helper para responder JSON con código HTTP, compartido por los tres endpoints.
- Puntuación: 10 puntos por bola de discoteca; `Validador::MAX_PUNTUACION = 4000` (tablero 20×20, máximo alcanzable ≈ 3970).
- Base de datos en Atlas: `conga_app` (colección `scores`); usuario por defecto del proyecto Atlas, credenciales solo en `.env`.
- Docker: `php:8.3-apache`, raíz web en `public/`, Composer con `mongodb/mongodb`. El mismo `Dockerfile` sirve para desarrollo y producción (ver apartado 4).
- Controles: flechas y WASD (RF-01). Se lee `evento.code`, no `evento.key`.
- Pantalla de juego: cabecera con jugador, récord, tiempo y puntos; aviso de nuevo récord (RF-15 a RF-17).
- Nuevo campo `duration` en cada partida (segundos), validado con `Validador::MAX_DURACION = 86400`.
- Pendiente de la fase de interfaz: que se distinga hacia dónde mira la conga.

## 1. Estructura de carpetas y ficheros

```
Conga/
├── docker-compose.yml        # PHP+Apache para desarrollo
├── Dockerfile                # PHP con la extensión de MongoDB
├── composer.json / .lock     # dependencia mongodb/mongodb
├── .dockerignore             # excluye .env, .git, vendor y docs de la imagen
├── .env                      # credenciales de Atlas (fuera de git)
├── .env.example              # plantilla sin secretos
├── .gitignore
├── README.md                 # descripción, puesta en marcha y despliegue
├── docs/                     # requisitos, diseño, contrato y pruebas
├── public/                   # lo único accesible desde el navegador
│   ├── index.html            # las 3 pantallas en una sola página
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js           # cambia de pantalla y orquesta el resto
│   │   ├── game.js           # lógica del juego y dibujo en canvas
│   │   ├── storage.js        # nombre en localStorage
│   │   └── api.js            # fetch hacia PHP
│   ├── img/                  # bola-discoteca.svg, persona.svg, persona-cabeza.svg
│   └── api/
│       ├── guardar_puntuacion.php
│       ├── ranking.php
│       └── maximo.php
└── src/                      # PHP interno, fuera del alcance del navegador
    ├── config.php            # lee .env
    ├── Database.php          # conexión a Atlas
    ├── Validador.php         # reglas de nombre, puntuación y duración
    └── Respuesta.php         # respuestas JSON con código HTTP
```

## 2. Pantallas

Estilo: fondo oscuro de discoteca, neones rosa/cian/amarillo. Tablero 20×20 en `<canvas>`.

**Inicio:** título, campo de nombre (relleno desde localStorage, 3-15 caracteres), récord personal, botón "¡A bailar!". Error de validación bajo el campo.

**Juego:** cabecera con jugador, récord, tiempo y puntos en vivo (RF-13, RF-16, RF-17), aviso "¡Nuevo récord!" (RF-15), tablero con la conga y la bola de discoteca, indicación de controles. La cabeza se distingue del resto. La partida empieza al pulsar una flecha (o W, A, S, D).

**Game over:** puntuación de la partida, tiempo, récord personal, mensaje de récord superado, top 10 (con la fila del jugador resaltada si aparece), botones "Otra vez" y "Cambiar nombre". Si Atlas falla se muestra un aviso en lugar del ranking (RNF-04) y los botones siguen funcionando.

## 3. Modelo de datos (MongoDB Atlas)

Colección única **`scores`**, un documento por partida:

```json
{
  "_id": ObjectId,
  "name": "Dani",
  "nameKey": "dani",
  "score": 50,
  "duration": 95,
  "createdAt": ISODate
}
```

- `name`: tal como lo escribió el jugador (se muestra en el ranking).
- `nameKey`: `name` en minúsculas (con soporte de ñ y tildes); es la clave para agrupar y buscar.
- `duration`: duración de la partida en segundos (entero). Las partidas guardadas antes del 21/10/2026 no lo tienen.
- Máximo histórico (RF-12): máximo de `score` con ese `nameKey`.
- Top 10 (RF-10): agrupar por `nameKey`, tomar el máximo de `score`, ordenar descendente, limitar a 10.
- Índice: `{ nameKey: 1, score: -1 }` (creado en Atlas).
- Sin colección de usuarios (no hay registro).

## 4. Despliegue (fase 5)

```
Navegador → https://conga-v1zc.onrender.com → Render (Docker, plan Free) → MongoDB Atlas
```

- **Alojamiento:** Render, Web Service con runtime Docker y plan gratuito. Se descartaron GitHub Pages (solo sirve ficheros estáticos, no ejecuta PHP) y Railway (deja de ser gratis tras el periodo de prueba).
- **Código:** repositorio público en GitHub (`dalvsua-maker/CONGA-`, rama `main`). Cada `git push` redespliega automáticamente.
- **Imagen de producción:** el `Dockerfile` copia el código y ejecuta `composer install --no-dev` dentro de la imagen; usa `php.ini-production` (errores solo al log) y hace que Apache escuche en el puerto de la variable `PORT` (Render usa 10000 por defecto).
- **Desarrollo:** `docker-compose.yml` monta la carpeta del proyecto en el contenedor (`localhost:8080`), así los cambios se ven al recargar.
- **Credenciales:** `MONGODB_URI` y `MONGODB_DB` como variables de entorno en Render; en local, en `.env`. Nunca en el código ni en Git.
- **Atlas:** *Network Access* permite las IP de salida de Render.
- **Base de datos compartida:** local y producción usan la misma base `conga_app`. Opcional: usar `MONGODB_DB=conga_dev` en local para no mezclar pruebas con el ranking real.
- **Limitaciones del plan gratuito:** el servicio se duerme tras 15 minutos sin visitas y la primera carga tarda cerca de un minuto; no hay disco persistente (no se necesita).
- **Pendiente de seguridad:** el usuario de base de datos de Atlas tiene permisos de administrador; conviene limitarlo a `readWrite` sobre `conga_app`.

## 5. Siguiente fase

Mantenimiento y mejora: apartado visual y jugable (que se distinga hacia dónde mira la conga, animaciones, sonido, pulido de interfaz).
