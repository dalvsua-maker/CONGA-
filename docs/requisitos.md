# CONGA! — Fase 1: Planificación y requisitos

## 1. Descripción del proyecto

Juego tipo Snake en el que, en vez de una serpiente, el jugador controla una fila de personas haciendo una conga. La manzana del Snake se sustituye por una bola de discoteca. Las reglas son las del Snake clásico.

Tecnologías permitidas: **HTML, CSS, JS y PHP**. Base de datos: **MongoDB Atlas**. Docker o similar permitido en desarrollo y despliegue.

## 2. Normas de trabajo

1. Se siguen todas las fases del SDLC.
2. Solo se pueden usar HTML, CSS, JS y PHP.

## 3. Requisitos funcionales

### Juego
- **RF-01:** El jugador controla la dirección de la conga con las flechas del teclado o con las teclas W, A, S, D.
- **RF-02:** La fila avanza sola y no puede girar 180° sobre sí misma.
- **RF-03:** En el tablero aparece una bola de discoteca; al alcanzarla, la fila crece y suma puntos.
- **RF-04:** La partida termina si la cabeza choca con un borde o con la propia fila.

### Usuario
- **RF-05:** Al entrar, el jugador introduce un nombre, que se guarda en localStorage y se reutiliza. Sin registro ni contraseña.
- **RF-06:** PHP acepta solo letras (con ñ y tildes), números y espacios, de 3 a 15 caracteres.
- **RF-07:** Se permiten nombres duplicados (de momento no se restringe).

### Puntuaciones
- **RF-08:** Al acabar la partida, la puntuación se guarda en MongoDB Atlas a través de PHP.
- **RF-09:** PHP valida que la puntuación sea un entero mayor o igual que 0.
- **RF-10:** La pantalla final muestra el top 10, con cada jugador una sola vez y su mejor puntuación.
- **RF-11:** La pantalla final muestra la puntuación de la partida y el máximo histórico del jugador.
- **RF-12:** El máximo histórico se calcula por nombre en la base de datos.
- **RF-13:** La puntuación actual se ve durante la partida, y el récord personal en inicio y game over.

### Pantallas
- **RF-14:** Existen tres pantallas: inicio, juego y game over.

### Ampliaciones
- **RF-15:** Durante la partida, si la puntuación supera el récord personal anterior (cuando este es mayor que 0), se avisa al jugador con un mensaje. En game over, una vez guardada la puntuación, se muestra también que ha superado su récord.
- **RF-16:** El récord personal se muestra también durante la partida, y se actualiza en vivo cuando se supera.
- **RF-17:** Un cronómetro (m:ss) muestra el tiempo de la partida desde la primera flecha pulsada. El tiempo final se muestra en game over.
- **RF-18:** La duración de la partida (en segundos) se guarda en la base de datos junto con la puntuación, en el campo `duration`. PHP valida que sea un entero mayor o igual que 0 y no superior a 86400 (24 h).

## 4. Requisitos no funcionales

- **RNF-01:** Solo HTML, CSS, JS y PHP (Docker permitido en desarrollo).
- **RNF-02:** Las credenciales de Atlas solo existen en el servidor, nunca en el JS.
- **RNF-03:** Funciona en las versiones actuales de Chrome y Firefox en ordenador.
- **RNF-04:** Si Atlas falla, el juego sigue funcionando y se avisa de que no se pudo guardar o cargar el ranking.
- **RNF-05:** El juego debe estar accesible online, sin depender de que ningún ordenador personal esté encendido, usando únicamente servicios gratuitos.

## 5. Operaciones JS → PHP (preliminar, a cerrar en diseño)

1. **Guardar puntuación:** envía nombre, puntuación y duración; PHP valida y guarda.
2. **Obtener ranking:** PHP devuelve el top 10.
3. **Obtener máximo histórico:** PHP devuelve el mejor resultado del nombre indicado.

## 6. Arquitectura general

`JS (navegador)` → `fetch` → `PHP (servidor)` → `MongoDB Atlas`

El navegador nunca habla con MongoDB. Solo PHP conoce las credenciales y valida los datos recibidos.

## 7. Estado de las fases del SDLC

| Fase | Estado |
|---|---|
| 1. Requisitos | Completada (20/10/2026) |
| 2. Diseño y contrato JS–PHP | Completada (20/10/2026) |
| 3. Implementación | Completada (21/10/2026) |
| 4. Pruebas | Completada: 30 de 30 casos (21/10/2026) |
| 5. Despliegue | Completada (21/10/2026): Render + Atlas |
| 6. Mantenimiento y mejora | En curso: mejora visual y jugable |
