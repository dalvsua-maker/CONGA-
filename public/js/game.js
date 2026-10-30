/** Lógica del juego: movimiento de la conga, bola, choques y dibujo en el canvas */

/* Tablero de 20x20 casillas de 30 px; cada bola da 10 puntos */
const COLUMNAS = 20;
const FILAS = 20;
const TAMANO_CASILLA = 30;
const PUNTOS_POR_BOLA = 10;
/** Milisegundos entre un movimiento y el siguiente (menos = más rápido) */
const MS_POR_PASO = 130;
const LARGO_INICIAL = 3;
/** Cuántos giros se pueden dejar apuntados entre un paso y el siguiente */
const MAX_DIRECCIONES_EN_COLA = 3;
/** Desde este retraso se descartan los pasos atrasados (pestaña en segundo plano) */
const RETRASO_MAXIMO_MS = MS_POR_PASO * 3;

/** Teclas de movimiento (flechas y WASD) y la dirección de cada una */
const DIRECCION_POR_TECLA = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

/** Hacia dónde mira la conga al empezar */
const DIRECCION_INICIAL = { x: 1, y: 0 };

/* Colores que se pintan si la imagen todavía no ha cargado */
const COLOR_BOLA = "#ffffff";
const COLOR_CABEZA = "#25f4ee";
const COLOR_PERSONA = "#ff2fb3";

/**
 * Giro de 180 grados: la conga se chocaría con ella misma.
 *
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {boolean}
 */
function sonOpuestas(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

/**
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {boolean}
 */
function sonIguales(a, b) {
  return a.x === b.x && a.y === b.y;
}

/**
 * Copia una lista de casillas; así cambiar una lista no cambia la otra.
 *
 * @param {Array<{x: number, y: number}>} casillas
 * @returns {Array<{x: number, y: number}>}
 */
function copiarCasillas(casillas) {
  return casillas.map((casilla) => ({ x: casilla.x, y: casilla.y }));
}

/**
 * Punto entre dos posiciones: con progreso 0 es `desde`, con 1 es `hasta` y
 * con 0,5 queda a medio camino.
 *
 * @param {{x: number, y: number}} desde
 * @param {{x: number, y: number}} hasta
 * @param {number} progreso Entre 0 y 1.
 * @returns {{x: number, y: number}}
 */
function interpolar(desde, hasta, progreso) {
  return {
    x: desde.x + (hasta.x - desde.x) * progreso,
    y: desde.y + (hasta.y - desde.y) * progreso,
  };
}

/**
 * Crea una imagen y empieza a cargarla.
 *
 * @param {string} ruta
 * @returns {HTMLImageElement}
 */
function cargarImagen(ruta) {
  const imagen = new Image();
  imagen.src = ruta;
  return imagen;
}

/* Se cargan una vez y se reutilizan en cada dibujo */
const IMG_PERSONA = cargarImagen("img/persona.svg");
const IMG_CABEZA = cargarImagen("img/persona-cabeza.svg");
const IMG_BOLA = cargarImagen("img/bola-discoteca.svg");

/**
 * Una partida de Conga. La conga es una lista de casillas {x, y} con la
 * cabeza en la posición 0.
 */
class Juego {
  /**
   * Recibe el canvas y las tres funciones con las que el juego avisa a main.js.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {(puntos: number) => void} alCambiarPuntos
   * @param {(puntos: number, segundos: number) => void} alTerminar
   * @param {(segundos: number) => void} alCambiarTiempo
   */
  constructor(canvas, alCambiarPuntos, alTerminar, alCambiarTiempo) {
    this.canvas = canvas;
    this.contexto = canvas.getContext("2d");
    this.alCambiarPuntos = alCambiarPuntos;
    this.alTerminar = alTerminar;
    this.alCambiarTiempo = alCambiarTiempo;
    this.idFotograma = null;
    this.alPulsarTecla = (evento) => this.manejarTecla(evento);
    this.alLlegarFotograma = (horaFotogramaMs) =>
      this.animarFotograma(horaFotogramaMs);
    this.reiniciarEstado();
  }

  /** Vuelve al estado inicial: conga en el centro, sin puntos y parada */
  reiniciarEstado() {
    const filaCentral = Math.floor(FILAS / 2);
    const columnaCabeza = Math.floor(COLUMNAS / 2);

    this.congaActual = [];
    for (let i = 0; i < LARGO_INICIAL; i++) {
      this.congaActual.push({ x: columnaCabeza - i, y: filaCentral });
    }

    // Posiciones del paso anterior: con ellas se anima el avance entre casillas
    this.congaAnterior = copiarCasillas(this.congaActual);
    this.inicioPasoMs = 0;

    this.direccion = DIRECCION_INICIAL;
    this.colaDirecciones = [];
    this.puntos = 0;
    this.enMarcha = false;
    this.bola = this.elegirCasillaLibre();
    this.inicioPartidaMs = 0;
    this.segundosJugados = 0;
  }

  /**
   * Elige una casilla libre al azar para la bola.
   *
   * @returns {{x: number, y: number}|null} null si no queda sitio.
   */
  elegirCasillaLibre() {
    const libres = [];

    for (let x = 0; x < COLUMNAS; x++) {
      for (let y = 0; y < FILAS; y++) {
        const ocupada = this.congaActual.some(
          (persona) => persona.x === x && persona.y === y,
        );
        if (!ocupada) {
          libres.push({ x, y });
        }
      }
    }

    if (libres.length === 0) {
      return null;
    }
    return libres[Math.floor(Math.random() * libres.length)];
  }

  /** Prepara una partida nueva; la conga no se mueve hasta pulsar una flecha */
  iniciar() {
    this.detener();
    this.reiniciarEstado();
    this.alCambiarPuntos(0);
    this.alCambiarTiempo(0);
    document.addEventListener("keydown", this.alPulsarTecla);
    this.dibujar();
  }

  /** Para el bucle de animación y deja de escuchar el teclado */
  detener() {
    cancelAnimationFrame(this.idFotograma);
    this.idFotograma = null;
    this.enMarcha = false;
    document.removeEventListener("keydown", this.alPulsarTecla);
  }

  /**
   * Apunta el giro pedido en la cola (sin giros de 180 grados, sin repetir la
   * misma dirección y con un máximo de MAX_DIRECCIONES_EN_COLA). La primera
   * tecla arranca la partida y da el primer paso al momento.
   *
   * @param {KeyboardEvent} evento
   */
  manejarTecla(evento) {
    const direccionPedida = DIRECCION_POR_TECLA[evento.code];
    if (!direccionPedida) {
      return;
    }
    evento.preventDefault();

    if (!this.sePuedeApuntarGiro(direccionPedida)) {
      return;
    }

    this.colaDirecciones.push(direccionPedida);

    if (!this.enMarcha) {
      this.arrancarPartida();
    }
  }

  /**
   * Dirección contra la que se valida un giro nuevo: la última de la cola o,
   * si está vacía, la que lleva la conga.
   *
   * @returns {{x: number, y: number}}
   */
  ultimaDireccion() {
    const cola = this.colaDirecciones;
    return cola.length > 0 ? cola[cola.length - 1] : this.direccion;
  }

  /**
   * Un giro se apunta si la cola no está llena, no da la vuelta entera y, con
   * la partida en marcha, cambia de dirección.
   *
   * @param {{x: number, y: number}} direccionPedida
   * @returns {boolean}
   */
  sePuedeApuntarGiro(direccionPedida) {
    const ultimaDireccion = this.ultimaDireccion();

    if (this.colaDirecciones.length >= MAX_DIRECCIONES_EN_COLA) {
      return false;
    }
    if (sonOpuestas(direccionPedida, ultimaDireccion)) {
      return false;
    }
    // Antes de empezar la conga ya mira a la derecha, y → tiene que poder arrancar
    if (this.enMarcha && sonIguales(direccionPedida, ultimaDireccion)) {
      return false;
    }
    return true;
  }

  /**
   * Primera tecla de la partida: arranca el cronómetro y da el primer paso al
   * momento, sin esperar al primer fotograma.
   */
  arrancarPartida() {
    this.inicioPartidaMs = Date.now();
    this.enMarcha = true;
    this.paso();
    this.arrancarAnimacion();
  }

  /**
   * Arranca el bucle de animación. El reloj del paso empieza a contar ahora;
   * el primer paso ya lo dio arrancarPartida.
   */
  arrancarAnimacion() {
    this.inicioPasoMs = performance.now();
    this.idFotograma = requestAnimationFrame(this.alLlegarFotograma);
  }

  /**
   * La llama el navegador antes de pintar cada fotograma, unas 60 veces por
   * segundo. Da los pasos que toquen, dibuja y pide el siguiente fotograma.
   *
   * @param {number} horaFotogramaMs Hora del fotograma en ms desde que se abrió
   * la página; va en el mismo reloj que performance.now().
   */
  animarFotograma(horaFotogramaMs) {
    this.descartarRetraso(horaFotogramaMs);
    this.darPasosPendientes(horaFotogramaMs);

    // Si un paso ha terminado la partida no se dibuja ni se pide otro fotograma
    if (!this.enMarcha) {
      return;
    }
    this.dibujar(horaFotogramaMs);
    this.idFotograma = requestAnimationFrame(this.alLlegarFotograma);
  }

  /**
   * Con la pestaña en segundo plano el navegador no llama al bucle. Al volver,
   * el retraso sería tan grande que la conga daría decenas de pasos de golpe:
   * si pasa de RETRASO_MAXIMO_MS se descarta y el paso cuenta desde ahora.
   *
   * @param {number} horaFotogramaMs
   */
  descartarRetraso(horaFotogramaMs) {
    if (horaFotogramaMs - this.inicioPasoMs > RETRASO_MAXIMO_MS) {
      this.inicioPasoMs = horaFotogramaMs;
    }
  }

  /**
   * Da los pasos que hayan tocado desde el último; con un fotograma lento
   * pueden ser más de uno. Se suma MS_POR_PASO y no la hora del fotograma para
   * no perder el sobrante: si el fotograma llega a los 132 ms, los 2 ms de más
   * cuentan para el paso siguiente.
   *
   * @param {number} horaFotogramaMs
   */
  darPasosPendientes(horaFotogramaMs) {
    while (this.enMarcha && this.haPasadoUnPaso(horaFotogramaMs)) {
      this.inicioPasoMs += MS_POR_PASO;
      this.paso();
    }
  }

  /**
   * @param {number} horaFotogramaMs
   * @returns {boolean}
   */
  haPasadoUnPaso(horaFotogramaMs) {
    return horaFotogramaMs - this.inicioPasoMs >= MS_POR_PASO;
  }

  /** Calcula los segundos de partida y avisa solo cuando cambian */
  actualizarCronometro() {
    const segundos = Math.floor((Date.now() - this.inicioPartidaMs) / 1000);
    if (segundos !== this.segundosJugados) {
      this.segundosJugados = segundos;
      this.alCambiarTiempo(segundos);
    }
  }

  /**
   * Un movimiento de la conga. Aplica el siguiente giro de la cola, si hay;
   * termina la partida si choca con el borde o consigo misma, y si come, crece
   * y suma puntos. No dibuja: de eso se encarga el bucle de animación.
   */
  paso() {
    this.actualizarCronometro();
    this.aplicarSiguienteGiro();

    // Antes de mover: dibujar() interpola entre esta copia y la conga nueva
    this.congaAnterior = copiarCasillas(this.congaActual);

    const destino = this.casillaDelante();
    const comeBola = this.hayBolaEn(destino);
    if (
      this.seSaleDelTablero(destino) ||
      this.chocaConLaConga(destino, comeBola)
    ) {
      this.terminar();
      return;
    }

    this.moverConga(destino, comeBola);
    if (comeBola) {
      this.registrarBolaComida();
    }

    // Sin casillas libres no se puede colocar otra bola
    if (this.bola === null) {
      this.terminar();
    }
  }

  /** Si hay un giro esperando en la cola, la conga lo toma; uno por paso */
  aplicarSiguienteGiro() {
    if (this.colaDirecciones.length > 0) {
      this.direccion = this.colaDirecciones.shift();
    }
  }

  /**
   * Casilla a la que iría la cabeza con la dirección actual.
   *
   * @returns {{x: number, y: number}}
   */
  casillaDelante() {
    const cabeza = this.congaActual[0];
    return { x: cabeza.x + this.direccion.x, y: cabeza.y + this.direccion.y };
  }

  /**
   * @param {{x: number, y: number}} casilla
   * @returns {boolean}
   */
  hayBolaEn(casilla) {
    return this.bola !== null && sonIguales(casilla, this.bola);
  }

  /**
   * @param {{x: number, y: number}} casilla
   * @returns {boolean}
   */
  seSaleDelTablero(casilla) {
    return (
      casilla.x < 0 ||
      casilla.x >= COLUMNAS ||
      casilla.y < 0 ||
      casilla.y >= FILAS
    );
  }

  /**
   * Si la conga no come, la cola se aparta en este mismo paso, así que la
   * cabeza puede ir a su casilla sin chocar.
   *
   * @param {{x: number, y: number}} casilla
   * @param {boolean} comeBola
   * @returns {boolean}
   */
  chocaConLaConga(casilla, comeBola) {
    const personasQueSeQuedan = comeBola
      ? this.congaActual
      : this.congaActual.slice(0, -1);
    return personasQueSeQuedan.some((persona) => sonIguales(persona, casilla));
  }

  /**
   * La cabeza avanza a su casilla nueva. Si no ha comido, sale la cola y la
   * conga mantiene el largo; si ha comido, crece una persona.
   *
   * @param {{x: number, y: number}} destino
   * @param {boolean} comeBola
   */
  moverConga(destino, comeBola) {
    this.congaActual.unshift(destino);
    if (!comeBola) {
      this.congaActual.pop();
    }
  }

  /** Suma los puntos, avisa y coloca otra bola con la conga ya crecida */
  registrarBolaComida() {
    this.puntos += PUNTOS_POR_BOLA;
    this.alCambiarPuntos(this.puntos);
    this.bola = this.elegirCasillaLibre();
  }

  /**
   * Borra el canvas y dibuja la bola y la conga. Cada persona se pinta entre su
   * casilla anterior y la actual según lo avanzado del paso.
   *
   * @param {number} horaFotogramaMs Hora del fotograma; sin ella se pinta al
   * principio del paso actual.
   */
  dibujar(horaFotogramaMs = this.inicioPasoMs) {
    this.contexto.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.bola) {
      this.dibujarEnPosicion(IMG_BOLA, this.bola, COLOR_BOLA);
    }

    const progreso = this.progresoDelPaso(horaFotogramaMs);
    this.congaActual.forEach((persona, indice) => {
      const anterior = this.casillaAnteriorDe(indice);
      const posicion = interpolar(anterior, persona, progreso);

      if (indice === 0) {
        this.dibujarEnPosicion(IMG_CABEZA, posicion, COLOR_CABEZA);
      } else {
        this.dibujarEnPosicion(IMG_PERSONA, posicion, COLOR_PERSONA);
      }
    });
  }

  /**
   * Qué parte del paso actual ha pasado: 0 al empezar y 1 al acabar. Con la
   * partida parada vale 1 y la conga se pinta donde está.
   *
   * @param {number} horaFotogramaMs
   * @returns {number}
   */
  progresoDelPaso(horaFotogramaMs) {
    if (!this.enMarcha) {
      return 1;
    }
    // Se recorta: el primer fotograma puede llegar con una hora anterior al inicio del paso
    const progreso = (horaFotogramaMs - this.inicioPasoMs) / MS_POR_PASO;
    return Math.min(Math.max(progreso, 0), 1);
  }

  /**
   * Dónde estaba esa persona antes del último paso. Si la conga ha crecido, la
   * persona nueva no tiene casilla anterior y usa la de la última.
   *
   * @param {number} indice
   * @returns {{x: number, y: number}}
   */
  casillaAnteriorDe(indice) {
    const ultimoIndice = this.congaAnterior.length - 1;
    return this.congaAnterior[Math.min(indice, ultimoIndice)];
  }

  /**
   * Dibuja una imagen en una posición, o un cuadrado de color si todavía no ha
   * cargado. La posición va en casillas y puede llevar decimales.
   *
   * @param {HTMLImageElement} imagen
   * @param {{x: number, y: number}} posicion
   * @param {string} colorRespaldo
   */
  dibujarEnPosicion(imagen, posicion, colorRespaldo) {
    const pixelX = posicion.x * TAMANO_CASILLA;
    const pixelY = posicion.y * TAMANO_CASILLA;

    if (imagen.complete && imagen.naturalWidth > 0) {
      this.contexto.drawImage(
        imagen,
        pixelX,
        pixelY,
        TAMANO_CASILLA,
        TAMANO_CASILLA,
      );
    } else {
      this.contexto.fillStyle = colorRespaldo;
      this.contexto.fillRect(
        pixelX + 2,
        pixelY + 2,
        TAMANO_CASILLA - 4,
        TAMANO_CASILLA - 4,
      );
    }
  }

  /** Cierra la partida y avisa con los puntos y los segundos */
  terminar() {
    this.actualizarCronometro();
    this.detener();
    this.alTerminar(this.puntos, this.segundosJugados);
  }
}
