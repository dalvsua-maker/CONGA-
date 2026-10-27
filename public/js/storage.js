/** Guarda el nombre del jugador en localStorage para no pedirlo cada vez */

/** Clave de localStorage donde se guarda el nombre */
const CLAVE_NOMBRE = 'conga_nombre';

/**
 * Devuelve el nombre guardado, o '' si no hay (o si localStorage falla).
 *
 * @returns {string}
 */
function obtenerNombre() {
  try {
    return localStorage.getItem(CLAVE_NOMBRE) || '';
  } catch {
    return '';
  }
}

/**
 * Guarda el nombre para la próxima vez. Si no hay almacenamiento no hace nada.
 *
 * @param {string} nombre
 */
function guardarNombre(nombre) {
  try {
    localStorage.setItem(CLAVE_NOMBRE, nombre);
  } catch {
    // sin almacenamiento no pasa nada
  }
}
