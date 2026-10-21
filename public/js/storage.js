const CLAVE_NOMBRE = 'conga_nombre';

function obtenerNombre() {
  try {
    return localStorage.getItem(CLAVE_NOMBRE) || '';
  } catch {
    return '';
  }
}

function guardarNombre(nombre) {
  try {
    localStorage.setItem(CLAVE_NOMBRE, nombre);
  } catch {
    // Sin almacenamiento disponible: el juego sigue funcionando igual
  }
}