/** Lógica del juego: movimiento de la conga, bola, choques y dibujo en el canvas */

/* Tablero de 20x20 casillas de 30 px; cada bola da 10 puntos */
const COLUMNAS = 20;
const FILAS = 20;
const TAMANO = 30;
const PUNTOS_POR_BOLA = 10;
/** Milisegundos entre un movimiento y el siguiente (menos = más rápido) */
const MS_POR_PASO = 130;
const LARGO_INICIAL = 3;
/** Cuántos giros se pueden dejar apuntados entre un paso y el siguiente */
const MAX_COLA = 3;

/** Teclas de movimiento (flechas y WASD) y la dirección de cada una */
const DIRECCIONES = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

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
    this.ctx = canvas.getContext("2d");
    this.alCambiarPuntos = alCambiarPuntos;
    this.alTerminar = alTerminar;
    this.alCambiarTiempo = alCambiarTiempo;
    this.idFrame = null;
    this.alPulsarTecla = (evento) => this.manejarTecla(evento);
    this.reiniciarEstado();
  }

  /** Vuelve al estado inicial: conga en el centro, sin puntos y parada */
  reiniciarEstado() {
    const filaCentral = Math.floor(FILAS / 2);
    const columnaCabeza = Math.floor(COLUMNAS / 2);

    this.conga = [];
    for (let i = 0; i < LARGO_INICIAL; i++) {
      this.conga.push({ x: columnaCabeza - i, y: filaCentral });
    }

    // Posiciones del paso anterior: con ellas se anima el avance entre casillas
    this.congaPrevia = this.conga.map((parte) => ({ x: parte.x, y: parte.y }));
    this.ultimoPaso = 0;

    this.direccion = DIRECCIONES.ArrowRight;
    this.colaDirecciones = [];
    this.puntos = 0;
    this.enMarcha = false;
    this.bola = this.nuevaBola();
    this.inicioMs = 0;
    this.segundos = 0;
  }

  /**
   * Elige una casilla libre al azar para la bola.
   *
   * @returns {{x: number, y: number}|null} null si no queda sitio.
   */
  nuevaBola() {
    const libres = [];

    for (let x = 0; x < COLUMNAS; x++) {
      for (let y = 0; y < FILAS; y++) {
        const ocupada = this.conga.some(
          (parte) => parte.x === x && parte.y === y,
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
    cancelAnimationFrame(this.idFrame);
    this.idFrame = null;
    this.enMarcha = false;
    document.removeEventListener("keydown", this.alPulsarTecla);
  }

  /**
   * Apunta el giro pedido en la cola (sin giros de 180 grados, sin repetir la
   * misma dirección y con un máximo de MAX_COLA). La primera tecla arranca la
   * partida y da el primer paso al momento.
   *
   * @param {KeyboardEvent} evento
   */
  manejarTecla(evento) {
    const nueva = DIRECCIONES[evento.code];
    if (!nueva) {
      return;
    }
    evento.preventDefault();

    // El giro se valida contra el último de la cola; si está vacía, contra la dirección actual
    const ultima =
      this.colaDirecciones.length > 0
        ? this.colaDirecciones[this.colaDirecciones.length - 1]
        : this.direccion;

    const esOpuesta = nueva.x === -ultima.x && nueva.y === -ultima.y;
    const esIgual = nueva.x === ultima.x && nueva.y === ultima.y;

    // Repetir la dirección solo se ignora con la partida en marcha; si no, → no podría arrancar
    if (
      esOpuesta ||
      (esIgual && this.enMarcha) ||
      this.colaDirecciones.length >= MAX_COLA
    ) {
      return;
    }

    this.colaDirecciones.push(nueva);

    if (!this.enMarcha) {
      this.inicioMs = Date.now();
      this.enMarcha = true;
      this.paso();
      if (this.enMarcha) {
        this.arrancarBucle();
      }
    }
  }

  /**
   * Bucle de animación: en cada fotograma ejecuta los pasos que toquen según el
   * tiempo real transcurrido y vuelve a dibujar.
   */
  arrancarBucle() {
    this.ultimoPaso = performance.now();

    const bucle = (ahora) => {
      // Si la pestaña estuvo en segundo plano, no se recuperan todos los pasos de golpe
      if (ahora - this.ultimoPaso > MS_POR_PASO * 3) {
        this.ultimoPaso = ahora;
      }

      while (ahora - this.ultimoPaso >= MS_POR_PASO) {
        this.ultimoPaso += MS_POR_PASO;
        this.paso();
        if (!this.enMarcha) {
          return;
        }
      }

      this.dibujar(ahora);
      this.idFrame = requestAnimationFrame(bucle);
    };

    this.idFrame = requestAnimationFrame(bucle);
  }

  /** Calcula los segundos de partida y avisa solo cuando cambian */
  actualizarTiempo() {
    const segundos = Math.floor((Date.now() - this.inicioMs) / 1000);
    if (segundos !== this.segundos) {
      this.segundos = segundos;
      this.alCambiarTiempo(segundos);
    }
  }

  /**
   * Un movimiento de la conga. Aplica el siguiente giro de la cola, si hay;
   * termina la partida si choca con el borde o consigo misma, y si come, crece
   * y suma puntos. No dibuja: de eso se encarga el bucle de animación.
   */
  paso() {
    this.actualizarTiempo();
    if (this.colaDirecciones.length > 0) {
      this.direccion = this.colaDirecciones.shift();
    }

    // Dónde estaba cada persona antes de moverse, para animar el avance
    this.congaPrevia = this.conga.map((parte) => ({ x: parte.x, y: parte.y }));

    const cabeza = this.conga[0];
    const nuevaCabeza = {
      x: cabeza.x + this.direccion.x,
      y: cabeza.y + this.direccion.y,
    };

    const fueraDelTablero =
      nuevaCabeza.x < 0 ||
      nuevaCabeza.x >= COLUMNAS ||
      nuevaCabeza.y < 0 ||
      nuevaCabeza.y >= FILAS;
    if (fueraDelTablero) {
      this.terminar();
      return;
    }

    const come =
      this.bola !== null &&
      nuevaCabeza.x === this.bola.x &&
      nuevaCabeza.y === this.bola.y;

    const cuerpo = come ? this.conga : this.conga.slice(0, -1);
    const chocaConsigo = cuerpo.some(
      (parte) => parte.x === nuevaCabeza.x && parte.y === nuevaCabeza.y,
    );
    if (chocaConsigo) {
      this.terminar();
      return;
    }

    this.conga.unshift(nuevaCabeza);

    if (come) {
      this.puntos += PUNTOS_POR_BOLA;
      this.alCambiarPuntos(this.puntos);
      this.bola = this.nuevaBola();
    } else {
      this.conga.pop();
    }

    if (this.bola === null) {
      this.terminar();
    }
  }

  /**
   * Borra el canvas y dibuja la bola y la conga. Cada persona se pinta entre su
   * casilla anterior y la actual según lo avanzado del paso.
   *
   * @param {number} ahora Marca de tiempo del fotograma (la que da requestAnimationFrame).
   */
  dibujar(ahora = this.ultimoPaso) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const avance = this.enMarcha ? (ahora - this.ultimoPaso) / MS_POR_PASO : 1;
    const progreso = Math.min(Math.max(avance, 0), 1);

    if (this.bola) {
      this.dibujarCasilla(IMG_BOLA, this.bola, "#ffffff");
    }

    this.conga.forEach((parte, indice) => {
      // Si la conga ha crecido, la persona nueva no tiene anterior y usa la última
      const previa =
        this.congaPrevia[Math.min(indice, this.congaPrevia.length - 1)];
      const casilla = {
        x: previa.x + (parte.x - previa.x) * progreso,
        y: previa.y + (parte.y - previa.y) * progreso,
      };

      if (indice === 0) {
        this.dibujarCasilla(IMG_CABEZA, casilla, "#25f4ee");
      } else {
        this.dibujarCasilla(IMG_PERSONA, casilla, "#ff2fb3");
      }
    });
  }

  /**
   * Dibuja una imagen en una casilla, o un cuadrado de color si todavía no ha cargado.
   *
   * @param {HTMLImageElement} imagen
   * @param {{x: number, y: number}} casilla
   * @param {string} colorRespaldo
   */
  dibujarCasilla(imagen, casilla, colorRespaldo) {
    const px = casilla.x * TAMANO;
    const py = casilla.y * TAMANO;

    if (imagen.complete && imagen.naturalWidth > 0) {
      this.ctx.drawImage(imagen, px, py, TAMANO, TAMANO);
    } else {
      this.ctx.fillStyle = colorRespaldo;
      this.ctx.fillRect(px + 2, py + 2, TAMANO - 4, TAMANO - 4);
    }
  }

  /** Cierra la partida y avisa con los puntos y los segundos */
  terminar() {
    this.actualizarTiempo();
    this.detener();
    this.alTerminar(this.puntos, this.segundos);
  }
}
