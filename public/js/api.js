/** Funciones que hablan con los endpoints de public/api/. */

/**
 * Hace la petición y devuelve el JSON. Lanza un Error si el servidor falla,
 * responde ok:false o tarda más de 8 s.
 *
 * @param {string} url Endpoint a llamar.
 * @param {RequestInit} [opciones] En un POST: method, headers y body.
 * @returns {Promise<Object>}
 */
async function pedir(url, opciones = {}) {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 8000);

  try {
    const respuesta = await fetch(url, { ...opciones, signal: control.signal });
    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.error || 'ERROR_DESCONOCIDO');
    }
    return datos;
  } finally {
    clearTimeout(temporizador);
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
  return pedir('api/guardar_puntuacion.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nombre, score: puntuacion, duration: duracion }),
  });
}

/**
 * Devuelve el top 10 como lista de { name, score }.
 *
 * @returns {Promise<Array>}
 */
async function obtenerRanking() {
  const datos = await pedir('api/ranking.php');
  return datos.ranking;
}

/**
 * Devuelve la mejor puntuación del jugador (0 si todavía no ha jugado).
 *
 * @param {string} nombre
 * @returns {Promise<number>}
 */
async function obtenerMaximo(nombre) {
  const datos = await pedir('api/maximo.php?name=' + encodeURIComponent(nombre));
  return datos.maximo;
}
