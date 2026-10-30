/** Controla las pantallas y conecta el juego (game.js) con el servidor (api.js) */

/* Elementos del DOM */
const pantallas = document.querySelectorAll(".pantalla");
const MENSAJE_NOMBRE_INVALIDO =
  "El nombre debe tener entre 3 y 15 caracteres: solo letras, números y espacios.";
const ui = {
  inicio: {
    formulario: document.getElementById("form-nombre"),
    input: document.getElementById("input-nombre"),
    error: document.getElementById("error-nombre"),
    record: document.getElementById("record-inicio"),
  },
  juego: {
    jugador: document.getElementById("jugador-juego"),
    record: document.getElementById("record-juego"),
    tiempo: document.getElementById("tiempo-juego"),
    puntos: document.getElementById("puntos-juego"),
    avisoRecord: document.getElementById("aviso-record-juego"),
    tablero: document.getElementById("tablero"),
  },
  final: {
    puntos: document.getElementById("puntos-final"),
    record: document.getElementById("record-final"),
    tiempo: document.getElementById("tiempo-final"),
    avisoRecord: document.getElementById("aviso-record-final"),
    avisoGuardado: document.getElementById("aviso-guardado"),
    ranking: document.getElementById("lista-ranking"),
    avisoRanking: document.getElementById("aviso-ranking"),
  },
};

/* Estado de la partida; recordAlEmpezar es null hasta que llega el récord del servidor */
let recordAlEmpezar = null;
let haSuperadoRecord = false;
let nombreJugador = "";

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
function extraerNombreValido(texto) {
  const nombre = texto.trim();
  const valido = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]{3,15}$/.test(nombre);
  return valido ? nombre : null;
}

/**
 * Pide el récord de un jugador y lo escribe en el elemento. Si falla escribe "–".
 *
 * @param {HTMLElement} elemento Donde se muestra el récord.
 * @param {string} nombre
 * @returns {Promise<number|null>} El récord, o null si no se pudo pedir.
 */
async function mostrarRecord(elemento, nombre) {
  try {
    const record = await obtenerMaximo(nombre);
    elemento.textContent = record;
    return record;
  } catch {
    elemento.textContent = "–";
    return null;
  }
}

/**
 * Rellena el récord de la pantalla de inicio.
 *
 * @param {string|null} nombre
 */
async function cargarRecordInicio(nombre) {
  if (!nombre) {
    ui.inicio.record.textContent = "0";
    return;
  }

  ui.inicio.record.textContent = "…";
  await mostrarRecord(ui.inicio.record, nombre);
}

/**
 * Pasa segundos a formato m:ss.
 *
 * @param {number} segundos
 * @returns {string}
 */
function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const resto = String(segundos % 60).padStart(2, "0");
  return `${minutos}:${resto}`;
}

/** Pide el récord al empezar para poder avisar cuando se supere */
async function cargarRecordJuego() {
  recordAlEmpezar = await mostrarRecord(ui.juego.record, nombreJugador);
}

/**
 * La llama Juego cada vez que cambia el segundo del cronómetro.
 *
 * @param {number} segundos
 */
function alCambiarTiempo(segundos) {
  ui.juego.tiempo.textContent = formatearTiempo(segundos);
}

/** Deja la pantalla de juego a cero, sin avisos, y la muestra */
function prepararPantallaJuego() {
  ui.juego.jugador.textContent = nombreJugador;
  ui.juego.puntos.textContent = "0";
  ui.juego.tiempo.textContent = "0:00";
  ui.juego.avisoRecord.textContent = "";
  ui.juego.record.textContent = "…";
  mostrarPantalla("pantalla-juego");
}

/** Empieza una partida nueva: reinicia el estado, arranca el juego y pide el récord */
function empezarPartida() {
  recordAlEmpezar = null;
  haSuperadoRecord = false;

  prepararPantallaJuego();
  juego.iniciar();
  cargarRecordJuego();
}

/**
 * Dice si estos puntos superan el récord con el que se empezó la partida.
 *
 * @param {number} puntos
 * @returns {boolean}
 */
function superaElRecord(puntos) {
  return recordAlEmpezar !== null && puntos > recordAlEmpezar;
}

/** Marca el récord como superado y lo avisa en la pantalla de juego */
function avisarNuevoRecord() {
  haSuperadoRecord = true;
  ui.juego.avisoRecord.textContent = "¡Nuevo récord!";
}

/**
 * La llama Juego al comer una bola. Actualiza el marcador y el récord, y avisa
 * si se supera (en la primera partida no se avisa).
 *
 * @param {number} puntos
 */
function alCambiarPuntos(puntos) {
  ui.juego.puntos.textContent = puntos;

  if (!superaElRecord(puntos)) {
    return;
  }

  ui.juego.record.textContent = puntos;
  if (recordAlEmpezar > 0) {
    avisarNuevoRecord();
  }
}

/** Al enviar el nombre: lo valida, lo guarda y empieza la partida */
function alEnviarNombre(evento) {
  evento.preventDefault();

  const nombre = extraerNombreValido(ui.inicio.input.value);
  if (nombre === null) {
    ui.inicio.error.textContent = MENSAJE_NOMBRE_INVALIDO;
    ui.inicio.error.hidden = false;
    return;
  }

  ui.inicio.error.hidden = true;
  nombreJugador = nombre;
  guardarNombre(nombre);
  empezarPartida();
}

/**
 * Rellena la pantalla de game over con esta partida, vacía lo que se pide
 * al servidor y la muestra.
 *
 * @param {number} puntos
 * @param {number} segundos
 */
function prepararPantallaFinal(puntos, segundos) {
  ui.final.puntos.textContent = puntos;
  ui.final.tiempo.textContent = formatearTiempo(segundos);
  ui.final.avisoRecord.textContent = "";
  ui.final.record.textContent = "…";
  ui.final.ranking.replaceChildren();
  ui.final.avisoGuardado.hidden = true;
  ui.final.avisoRanking.hidden = true;
  mostrarPantalla("pantalla-gameover");
}

/**
 * Guarda la puntuación en el servidor. Si sale bien y se ha superado el
 * récord, lo felicita; si falla, enseña un aviso.
 *
 * @param {number} puntos
 * @param {number} segundos
 */
async function guardarResultado(puntos, segundos) {
  try {
    await guardarPuntuacion(nombreJugador, puntos, segundos);
    if (haSuperadoRecord) {
      ui.final.avisoRecord.textContent = "¡Has superado tu récord!";
    }
  } catch {
    ui.final.avisoGuardado.textContent = "No se pudo guardar tu puntuación.";
    ui.final.avisoGuardado.hidden = false;
  }
}

/**
 * La llama Juego al terminar. Guarda la puntuación y después carga el ranking
 * y el récord, para que ya incluyan esta partida.
 *
 * @param {number} puntos
 * @param {number} segundos
 */
async function alTerminar(puntos, segundos) {
  prepararPantallaFinal(puntos, segundos);
  await guardarResultado(puntos, segundos);

  cargarRanking();
  mostrarRecord(ui.final.record, nombreJugador);
}

/** Pide el top 10 y lo pinta; si falla, enseña un aviso */
async function cargarRanking() {
  try {
    const ranking = await obtenerRanking();
    pintarRanking(ranking);
  } catch {
    ui.final.avisoRanking.textContent = "No se pudo cargar el ranking.";
    ui.final.avisoRanking.hidden = false;
  }
}

/**
 * Dibuja el ranking en la lista y resalta la fila del jugador actual.
 *
 * @param {Array<{name: string, score: number}>} ranking
 */
function pintarRanking(ranking) {
  ui.final.ranking.replaceChildren();

  ranking.forEach((fila) => {
    const elemento = document.createElement("li");
    elemento.textContent = `${fila.name} — ${fila.score}`;

    if (fila.name.toLowerCase() === nombreJugador.toLowerCase()) {
      elemento.classList.add("propio");
    }
    ui.final.ranking.appendChild(elemento);
  });
}

/** Al salir del campo del nombre: enseña el récord de ese nombre */
function alEscribirNombre() {
  cargarRecordInicio(extraerNombreValido(ui.inicio.input.value));
}

/** Vuelve a la pantalla de inicio para poder escribir otro nombre */
function alCambiarNombre() {
  mostrarPantalla("pantalla-inicio");
  ui.inicio.input.focus();
  cargarRecordInicio(nombreJugador);
}

/* Eventos */
ui.inicio.formulario.addEventListener("submit", alEnviarNombre);
ui.inicio.input.addEventListener("change", alEscribirNombre);
document
  .getElementById("btn-otra-vez")
  .addEventListener("click", empezarPartida);
document
  .getElementById("btn-cambiar-nombre")
  .addEventListener("click", alCambiarNombre);

/* Arranque */
const juego = new Juego(
  ui.juego.tablero,
  alCambiarPuntos,
  alTerminar,
  alCambiarTiempo,
);

nombreJugador = extraerNombreValido(obtenerNombre()) || "";
ui.inicio.input.value = nombreJugador;
cargarRecordInicio(nombreJugador);
mostrarPantalla("pantalla-inicio");
