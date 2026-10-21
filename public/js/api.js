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

async function guardarPuntuacion(nombre, puntuacion, duracion) {
  return pedir('api/guardar_puntuacion.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nombre, score: puntuacion, duration: duracion }),
  });
}
async function obtenerRanking() {
  const datos = await pedir('api/ranking.php');
  return datos.ranking;
}

async function obtenerMaximo(nombre) {
  const datos = await pedir('api/maximo.php?name=' + encodeURIComponent(nombre));
  return datos.maximo;
}