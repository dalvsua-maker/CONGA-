/** Controla las pantallas y conecta el juego (game.js) con el servidor (api.js) */

/* Elementos del DOM */
const pantallas = document.querySelectorAll('.pantalla');
const formNombre = document.getElementById('form-nombre');
const inputNombre = document.getElementById('input-nombre');
const errorNombre = document.getElementById('error-nombre');
const recordInicio = document.getElementById('record-inicio');
const jugadorJuego = document.getElementById('jugador-juego');
const puntosJuego = document.getElementById('puntos');
const tablero = document.getElementById('tablero');
const puntosFinal = document.getElementById('puntos-final');
const recordFinal = document.getElementById('record-final');
const avisoGuardado = document.getElementById('aviso-guardado');
const listaRanking = document.getElementById('lista-ranking');
const avisoRanking = document.getElementById('aviso-ranking');
const recordJuego = document.getElementById('record-juego');
const tiempoJuego = document.getElementById('tiempo');
const avisoRecord = document.getElementById('aviso-record');
const tiempoFinal = document.getElementById('tiempo-final');
const mensajeRecord = document.getElementById('mensaje-record');

/* Estado de la partida; recordPrevio es null hasta que llega el récord del servidor */
let recordPrevio = null;
let recordSuperado = false;
let nombreActual = '';

/**
 * Muestra una pantalla y oculta las demás.
 *
 * @param {string} id Id de la pantalla.
 */
function mostrarPantalla(id) {
  pantallas.forEach((pantalla) => {
    pantalla.hidden = pantalla.id !== id;
  });
}

/**
 * Comprueba el nombre con la misma regla que Validador.php (solo avisa rápido,
 * la validación que cuenta es la del servidor).
 *
 * @param {string} texto
 * @returns {string|null} El nombre limpio, o null si no vale.
 */
function validarNombre(texto) {
  const nombre = texto.trim();
  const valido = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]{3,15}$/.test(nombre);
  return valido ? nombre : null;
}

/**
 * Rellena el récord de la pantalla de inicio.
 *
 * @param {string|null} nombre
 */
async function cargarRecordInicio(nombre) {
  if (!nombre) {
    recordInicio.textContent = '0';
    return;
  }

  recordInicio.textContent = '…';
  try {
    recordInicio.textContent = await obtenerMaximo(nombre);
  } catch {
    recordInicio.textContent = '–';
  }
}

/**
 * Pasa segundos a formato m:ss.
 *
 * @param {number} segundos
 * @returns {string}
 */
function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = String(segundos % 60).padStart(2, '0');
  return `${minutos}:${resto}`;
}

/** Pide el récord al empezar para poder avisar cuando se supere */
async function cargarRecordJuego() {
  try {
    recordPrevio = await obtenerMaximo(nombreActual);
    recordJuego.textContent = recordPrevio;
  } catch {
    recordJuego.textContent = '–';
  }
}

/** Deja la pantalla de juego a cero y arranca una partida nueva */
function empezarPartida() {
  jugadorJuego.textContent = nombreActual;
  puntosJuego.textContent = '0';
  tiempoJuego.textContent = '0:00';
  avisoRecord.textContent = '';
  recordJuego.textContent = '…';
  recordPrevio = null;
  recordSuperado = false;

  mostrarPantalla('pantalla-juego');
  juego.iniciar();
  cargarRecordJuego();
}

/**
 * La llama Juego al comer una bola. Actualiza el marcador y avisa si se supera
 * el récord (en la primera partida no se avisa).
 *
 * @param {number} puntos
 */
function alCambiarPuntos(puntos) {
  puntosJuego.textContent = puntos;

  if (recordPrevio !== null && puntos > recordPrevio) {
    recordJuego.textContent = puntos;

    if (recordPrevio > 0) {
      recordSuperado = true;
      avisoRecord.textContent = '¡Nuevo récord!';
    }
  }
}

/** Al enviar el nombre: lo valida, lo guarda y empieza la partida */
formNombre.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const nombre = validarNombre(inputNombre.value);
  if (nombre === null) {
    errorNombre.textContent =
      'El nombre debe tener entre 3 y 15 caracteres: solo letras, números y espacios.';
    errorNombre.hidden = false;
    return;
  }

  errorNombre.hidden = true;
  nombreActual = nombre;
  guardarNombre(nombre);
  empezarPartida();
});

/**
 * La llama Juego al terminar. Guarda la puntuación y después carga el ranking
 * y el récord, para que ya incluyan esta partida.
 *
 * @param {number} puntos
 * @param {number} segundos
 */
async function alTerminar(puntos, segundos) {
  puntosFinal.textContent = puntos;
  tiempoFinal.textContent = formatearTiempo(segundos);
  mensajeRecord.textContent = '';
  recordFinal.textContent = '…';
  listaRanking.replaceChildren();
  avisoGuardado.hidden = true;
  avisoRanking.hidden = true;
  mostrarPantalla('pantalla-gameover');

  try {
    await guardarPuntuacion(nombreActual, puntos, segundos);
    if (recordSuperado) {
      mensajeRecord.textContent = '¡Has superado tu récord!';
    }
  } catch {
    avisoGuardado.textContent = 'No se pudo guardar tu puntuación.';
    avisoGuardado.hidden = false;
  }

  cargarRanking();
  cargarRecordFinal();
}

/** Pide el top 10 y lo pinta; si falla, enseña un aviso */
async function cargarRanking() {
  try {
    const ranking = await obtenerRanking();
    pintarRanking(ranking);
  } catch {
    avisoRanking.textContent = 'No se pudo cargar el ranking.';
    avisoRanking.hidden = false;
  }
}

/**
 * Dibuja el ranking en la lista y resalta la fila del jugador actual.
 *
 * @param {Array<{name: string, score: number}>} ranking
 */
function pintarRanking(ranking) {
  listaRanking.replaceChildren();

  ranking.forEach((fila) => {
    const elemento = document.createElement('li');
    elemento.textContent = `${fila.name} — ${fila.score}`;

    if (fila.name.toLowerCase() === nombreActual.toLowerCase()) {
      elemento.classList.add('propio');
    }
    listaRanking.appendChild(elemento);
  });
}

/** Rellena el récord de la pantalla de game over */
async function cargarRecordFinal() {
  try {
    recordFinal.textContent = await obtenerMaximo(nombreActual);
  } catch {
    recordFinal.textContent = '–';
  }
}

/* Botones */
document.getElementById('btn-otra-vez').addEventListener('click', empezarPartida);

document.getElementById('btn-cambiar-nombre').addEventListener('click', () => {
  mostrarPantalla('pantalla-inicio');
  inputNombre.focus();
  cargarRecordInicio(nombreActual);
});

inputNombre.addEventListener('change', () => {
  cargarRecordInicio(validarNombre(inputNombre.value));
});

/* Arranque */
const juego = new Juego(
  tablero,
  alCambiarPuntos,
  alTerminar,
  (segundos) => { tiempoJuego.textContent = formatearTiempo(segundos); }
);

nombreActual = validarNombre(obtenerNombre()) || '';
inputNombre.value = nombreActual;
cargarRecordInicio(nombreActual);
mostrarPantalla('pantalla-inicio');
