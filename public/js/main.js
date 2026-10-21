// Elementos del DOM
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

let recordPrevio = null;
let recordSuperado = false;
let nombreActual = '';
// Muestra la pantalla indicada y oculta las demás
function mostrarPantalla(id) {
  pantallas.forEach((pantalla) => {
    pantalla.hidden = pantalla.id !== id;
  });
}

function validarNombre(texto) {
  const nombre = texto.trim();
  const valido = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]{3,15}$/.test(nombre);
  return valido ? nombre : null;
}
// Carga el record del jugador al iniciar la pantalla de inicio
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
// Inicia la partida
function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = String(segundos % 60).padStart(2, '0');
  return `${minutos}:${resto}`;
}

async function cargarRecordJuego() {
  try {
    recordPrevio = await obtenerMaximo(nombreActual);
    recordJuego.textContent = recordPrevio;
  } catch {
    recordJuego.textContent = '–';
  }
}

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
// Cargar el ranking y mostrarlo en la pantalla de Game Over
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
async function cargarRanking() {
  try {
    const ranking = await obtenerRanking();
    pintarRanking(ranking);
  } catch {
    avisoRanking.textContent = 'No se pudo cargar el ranking.';
    avisoRanking.hidden = false;
  }
}

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

async function cargarRecordFinal() {
  try {
    recordFinal.textContent = await obtenerMaximo(nombreActual);
  } catch {
    recordFinal.textContent = '–';
  }
}
// Eventos de los botones
document.getElementById('btn-otra-vez').addEventListener('click', empezarPartida);

document.getElementById('btn-cambiar-nombre').addEventListener('click', () => {
  mostrarPantalla('pantalla-inicio');
  inputNombre.focus();
  cargarRecordInicio(nombreActual);
});

inputNombre.addEventListener('change', () => {
  cargarRecordInicio(validarNombre(inputNombre.value));
});

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