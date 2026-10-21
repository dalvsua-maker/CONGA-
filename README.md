# CONGA!

Juego tipo Snake para navegador: en vez de una serpiente, controlas una fila de personas haciendo la conga, y la manzana es una bola de discoteca. Con ranking global, récord personal y cronómetro.

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript (sin librerías), dibujo en `<canvas>`.
- **Backend:** PHP 8.3 con la librería oficial `mongodb/mongodb`.
- **Base de datos:** MongoDB Atlas.
- **Desarrollo:** Docker (PHP + Apache).

## Controles

Flechas del teclado o W, A, S, D. La partida empieza al pulsar la primera tecla.

## Ejecutar en local (desarrollo)

Para programar y probar cambios en tu ordenador. Si solo quieres jugar, usa la versión online (ver *Despliegue*).

Requisitos: Docker Desktop y un clúster de MongoDB Atlas con un usuario de base de datos y tu IP permitida en *Network Access*.

1. Copia `.env.example` a `.env` y rellénalo (ver más abajo).
2. Arranca el servidor:
   ```
   docker compose up --build
   ```
3. En otra terminal, instala las dependencias de PHP:
   ```
   docker compose exec web composer install
   ```
4. Abre `http://localhost:8080`.

## Configuración (`.env`)

```
MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@TU-CLUSTER.mongodb.net/
MONGODB_DB=conga_app
```

El fichero `.env` contiene credenciales y **nunca se sube a Git** (está en `.gitignore`). Solo PHP lo lee; el navegador no tiene acceso a él.

## Despliegue

- **Juego online:** https://conga-v1zc.onrender.com/
- **Alojamiento:** Render (plan Free, runtime Docker, construido desde el `Dockerfile` del repositorio).
- **Base de datos:** MongoDB Atlas. La URI y el nombre de la base se configuran como variables de entorno en Render (`MONGODB_URI`, `MONGODB_DB`), nunca en el código.
- **Actualizar:** cada `git push` a `main` redespliega automáticamente.
- **Aviso:** con el plan gratuito el servicio se duerme tras 15 minutos sin visitas; la primera carga después puede tardar cerca de un minuto.

## Estructura

```
Dockerfile, docker-compose.yml  Imagen (desarrollo y producción) y arranque local
public/            Lo único accesible desde el navegador
  index.html       Las tres pantallas (inicio, juego, game over)
  css/, js/, img/  Estilos, lógica del juego y gráficos SVG
  api/             Endpoints PHP: guardar_puntuacion, ranking, maximo
src/               PHP interno: configuración, conexión, validación, respuestas
docs/              Documentación del proyecto (SDLC)
```

## Documentación

En `docs/`:

- `requisitos.md`: qué debe hacer el juego (fase 1).
- `disenyo.md`: estructura, pantallas, datos y despliegue (fases 2 y 5).
- `contrato.md`: el contrato entre el JS y el PHP (fase 2).
- `pruebas.md`: plan de pruebas (fase 4).

## Seguridad

- Las credenciales de Atlas solo existen en el servidor.
- PHP valida el nombre (letras, números y espacios, de 3 a 15 caracteres), la puntuación y la duración antes de guardar nada.
- Limitación conocida: no hay registro ni contraseñas, así que un envío manual de puntuaciones falsas es posible; los topes de validación reducen el abuso.
