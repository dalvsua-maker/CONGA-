# CONGA! — Fase 4: Plan de pruebas

Estado: **completada el 21/10/2026: 30 de 30 casos correctos**, sin fallos.

Cómo usarlo: se ejecuta cada caso en el navegador (Chrome y Firefox) con la aplicación en `http://localhost:8080` (desarrollo). Para repetir el plan en producción se usa la URL pública de Render en lugar de `localhost:8080`. Cuando un caso sale bien, se marca cambiando `[ ]` por `[x]` (en VS Code, con la extensión Markdown All in One: Alt+C sobre la línea). Si falla, se deja `[ ]` y se añade debajo una nota con ❌ y lo que pasó.

## Juego

- [x] **P-01 · RF-01** — Pasos: Pulsar flechas y W, A, S, D. **Esperado:** La conga gira en las 4 direcciones con ambos controles
- [x] **P-02 · RF-02** — Pasos: Yendo a la derecha, pulsar izquierda. Después, yendo a la derecha, pulsar arriba e izquierda muy rápido. **Esperado:** No hay giro de 180° ni choque inmediato
- [x] **P-03 · RF-02** — Pasos: Al empezar, pulsar izquierda. **Esperado:** La partida no arranca
- [x] **P-04 · RF-03** — Pasos: Comer una bola. **Esperado:** La fila crece 1, suma 10 y la nueva bola nunca aparece sobre la conga
- [x] **P-05 · RF-04** — Pasos: Chocar contra cada uno de los 4 bordes. **Esperado:** Game over en los 4 casos
- [x] **P-06 · RF-04** — Pasos: Enroscarse hasta chocar con la propia fila. **Esperado:** Game over
- [x] **P-07 · RF-04** — Pasos: Seguir a la propia cola de cerca sin tocarla. **Esperado:** No hay choque
- [x] **P-08 · —** — Pasos: Jugar con las flechas. **Esperado:** La página no hace scroll

## Usuario

- [x] **P-09 · RF-05** — Pasos: Jugar con un nombre y recargar la página. **Esperado:** El nombre aparece ya escrito
- [x] **P-10 · RF-06** — Pasos: Probar `ab`, 16 caracteres, `Dani!` y vacío. **Esperado:** Mensaje de error y no empieza la partida
- [x] **P-11 · RF-06** — Pasos: Probar `José Luis`, `Ñandú 7`, `abc` y 15 caracteres. **Esperado:** Se aceptan
- [x] **P-12 · RF-07** — Pasos: Jugar como `Ana` y como `ana`. **Esperado:** Mismo jugador: récord compartido y una sola entrada en el ranking

## Puntuaciones

- [x] **P-13 · RF-08, RF-18** — Pasos: Jugar y morir; mirar `scores` en Atlas. **Esperado:** Documento nuevo con `name`, `nameKey`, `score`, `createdAt` y `duration`, sin campos de más
- [x] **P-14 · RF-09** — Pasos: Ver "Pruebas por consola". **Esperado:** `PUNTUACION_INVALIDA` con -1, `'50'`, 50.5 y 99999
- [x] **P-15 · RF-10** — Pasos: Con más de 10 jugadores, mirar game over. **Esperado:** Solo 10, ordenados, sin repetir jugador
- [x] **P-16 · RF-11, RF-12** — Pasos: Comparar el récord de game over con Atlas. **Esperado:** Coincide con la mejor puntuación del jugador
- [x] **P-17 · RF-13** — Pasos: Mirar inicio, juego y game over. **Esperado:** Récord visible en las tres pantallas y puntos en juego

## Pantallas y ampliaciones

- [x] **P-18 · RF-14** — Pasos: Inicio → juego → game over → "Otra vez" y "Cambiar nombre". **Esperado:** Todas las transiciones funcionan
- [x] **P-19 · RF-15** — Pasos: Superar un récord mayor que 0; repetir con un jugador nuevo. **Esperado:** Aparece "¡Nuevo récord!" y, en game over, "¡Has superado tu récord!"; con jugador nuevo no aparece ningún aviso
- [x] **P-20 · RF-16** — Pasos: Superar el récord. **Esperado:** El récord de la cabecera sube con la puntuación
- [x] **P-21 · RF-17** — Pasos: Jugar más de un minuto. **Esperado:** El cronómetro arranca con la primera flecha, para al morir y muestra `m:ss`
- [x] **P-22 · RF-18** — Pasos: Comparar el cronómetro con `duration` en Atlas. **Esperado:** Coinciden; sin `duration` el servidor devuelve `DURACION_INVALIDA`

## No funcionales

- [x] **P-23 · RNF-02** — Pasos: Abrir `/.env`, `/composer.json` y `/src/config.php` en el navegador; revisar el código fuente y la pestaña Network. **Esperado:** 404 en los tres; las credenciales no aparecen en ningún sitio
- [x] **P-24 · RNF-03** — Pasos: Repetir P-01, P-18 y P-21 en Chrome y en Firefox. **Esperado:** Mismo resultado en ambos
- [x] **P-25 · RNF-04** — Pasos: F12 → Network → Offline y morir. **Esperado:** Game over con avisos de que no se pudo guardar ni cargar el ranking; los botones siguen funcionando
- [x] **P-26 · RNF-04** — Pasos: Con la URI de `.env` rota a propósito, reiniciar Docker y jugar. **Esperado:** El juego funciona y el servidor responde `BD_NO_DISPONIBLE` (503). Restaurar el `.env` después
- [x] **P-27 · RNF-04** — Pasos: Offline en la pantalla de inicio. **Esperado:** El récord muestra `–`

## Contrato de la API

- [x] **P-28 · Contrato** — Pasos: Abrir `/api/guardar_puntuacion.php` en el navegador (GET). **Esperado:** 405 `METODO_NO_PERMITIDO`
- [x] **P-29 · Contrato** — Pasos: Ver "Pruebas por consola" (cuerpos raros). **Esperado:** `NOMBRE_INVALIDO` con un objeto `{"$ne": ""}` y con texto que no es JSON
- [x] **P-30 · Contrato** — Pasos: Abrir `/api/maximo.php?name[]=x` y `/api/maximo.php`. **Esperado:** 400 `NOMBRE_INVALIDO`

## Pruebas por consola

Pegar primero en la consola (F12) la función de ayuda:

```js
const probar = (c) => fetch('/api/guardar_puntuacion.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: typeof c === 'string' ? c : JSON.stringify(c)
}).then(r => r.json()).then(console.log);
```

Y después, cada una por separado (ninguna guarda nada, todas deben ser rechazadas):

```js
probar({name: 'dani', score: -1, duration: 10})        // PUNTUACION_INVALIDA
probar({name: 'dani', score: '50', duration: 10})      // PUNTUACION_INVALIDA
probar({name: 'dani', score: 50.5, duration: 10})      // PUNTUACION_INVALIDA
probar({name: 'dani', score: 99999, duration: 10})     // PUNTUACION_INVALIDA
probar({name: 'dani', score: 10})                      // DURACION_INVALIDA
probar({name: {$ne: ''}, score: 10, duration: 5})      // NOMBRE_INVALIDO
probar('esto no es json')                              // NOMBRE_INVALIDO
```

## Resultado final

Los 30 casos están marcados con `[x]`: la fase 4 queda cerrada. Los fallos se anotan aquí y se corrigen antes de pasar a la fase 5 (despliegue).

## Comprobación en producción (fase 5)

- 21/10/2026: la imagen de producción se probó primero en local (`localhost:8081`, con `PORT=10000`) y funcionó.
- 21/10/2026: tras desplegar en Render y permitir sus IP en Atlas, se comprobó en la URL pública que el juego, el guardado de puntuaciones y el ranking funcionan correctamente.
- Pendiente cuando se cambie la interfaz: repetir los casos P-01, P-05, P-18 y P-24 (controles, choques, transiciones y navegadores), y revisar P-08 (sin scroll) y la adaptación a pantallas pequeñas.
