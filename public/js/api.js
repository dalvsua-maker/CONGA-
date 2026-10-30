/** Funciones que hablan con los endpoints de public/api/. */

/** Milisegundos que se espera al servidor antes de cancelar la petición */
const TIEMPO_MAXIMO_MS = 8000;

/**
 * Hace la petición y devuelve el JSON. Lanza un Error si el servidor falla,
 * responde ok:false o tarda más de TIEMPO_MAXIMO_MS.
 *
 * @param {string} url Endpoint a llamar.
 * @param {RequestInit} [opciones] En un POST: method, headers y body.
 * @returns {Promise<Object>}
 */
async function pedirJson(url, opciones = {}) {
  const controlador = new AbortController();
  const temporizadorAbortar = setTimeout(
    () => controlador.abort(),
    TIEMPO_MAXIMO_MS,
  );

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      signal: controlador.signal,
    });
    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.error || "ERROR_DESCONOCIDO");
    }
    return datos;
  } finally {
    clearTimeout(temporizadorAbortar);
  }
}

/**
 * Guarda la partida en el servidor.
 *
 * @param {string} nombre
 * @param {number} puntuacion
 * @param {number} duracion En segundos.
 * @returns {Promise<Object>}
 */
async function guardarPuntuacion(nombre, puntuacion, duracion) {
  return pedirJson("api/guardar_puntuacion.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nombre,
      score: puntuacion,
      duration: duracion,
    }),
  });
}

/**
 * Devuelve el top 10 como lista de { name, score }.
 *
 * @returns {Promise<Array>}
 */
async function obtenerRanking() {
  const datos = await pedirJson("api/ranking.php");
  return datos.ranking;
}

/**
 * Devuelve la mejor puntuación del jugador (0 si todavía no ha jugado).
 *
 * @param {string} nombre
 * @returns {Promise<number>}
 */
async function obtenerMaximo(nombre) {
  const datos = await pedirJson(
    "api/maximo.php?name=" + encodeURIComponent(nombre),
  );
  return datos.maximo;
}
