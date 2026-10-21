// Constantes de configuración
const COLUMNAS = 20;
const FILAS = 20;
const TAMANO = 30;
const PUNTOS_POR_BOLA = 10;
const MS_POR_PASO = 130;
const LARGO_INICIAL = 3;

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

// Función para cargar imágenes
function cargarImagen(ruta) {
  const imagen = new Image();
  imagen.src = ruta;
  return imagen;
}

const IMG_PERSONA = cargarImagen("img/persona.svg");
const IMG_CABEZA = cargarImagen("img/persona-cabeza.svg");
const IMG_BOLA = cargarImagen("img/bola-discoteca.svg");

// Clase principal del juego
class Juego {
  constructor(canvas, alCambiarPuntos, alTerminar, alCambiarTiempo) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.alCambiarPuntos = alCambiarPuntos;
    this.alTerminar = alTerminar;
    this.alCambiarTiempo = alCambiarTiempo;
    this.temporizador = null;
    this.alPulsarTecla = (evento) => this.manejarTecla(evento);
    this.reiniciarEstado();
  }
  // Reinicia el estado del juego
  reiniciarEstado() {
    const filaCentral = Math.floor(FILAS / 2);
    const columnaCabeza = Math.floor(COLUMNAS / 2);

    this.conga = [];
    for (let i = 0; i < LARGO_INICIAL; i++) {
      this.conga.push({ x: columnaCabeza - i, y: filaCentral });
    }

    this.direccion = DIRECCIONES.ArrowRight;
    this.direccionPendiente = null;
    this.puntos = 0;
    this.enMarcha = false;
    this.bola = this.nuevaBola();
           this.inicioMs = 0;
       this.segundos = 0;
  }
  // Genera una nueva bola en una posición libre
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
  // Inicia el juego
  iniciar() {
    this.detener();
    this.reiniciarEstado();
    this.alCambiarPuntos(0);
           this.alCambiarTiempo(0);
    document.addEventListener("keydown", this.alPulsarTecla);
    this.dibujar();
  }
  // Detiene el juego
  detener() {
    clearInterval(this.temporizador);
    this.temporizador = null;
    document.removeEventListener("keydown", this.alPulsarTecla);
  }
  // Maneja la pulsación de teclas
  manejarTecla(evento) {
    const nueva = DIRECCIONES[evento.code];
    if (!nueva) {
      return;
    }
    evento.preventDefault();

    const esOpuesta =
      nueva.x === -this.direccion.x && nueva.y === -this.direccion.y;
    if (esOpuesta) {
      return;
    }

    this.direccionPendiente = nueva;

    if (!this.enMarcha) {
                 this.inicioMs = Date.now();
      this.enMarcha = true;
      this.temporizador = setInterval(() => this.paso(), MS_POR_PASO);
    }
  }
  // Actualiza el tiempo transcurrido
       actualizarTiempo() {
       const segundos = Math.floor((Date.now() - this.inicioMs) / 1000);
       if (segundos !== this.segundos) {
         this.segundos = segundos;
         this.alCambiarTiempo(segundos);
       }
     }
  // Realiza un paso del juego
  paso() {
           this.actualizarTiempo();
    if (this.direccionPendiente) {
      this.direccion = this.direccionPendiente;
      this.direccionPendiente = null;
    }

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

    this.dibujar();

    if (this.bola === null) {
      this.terminar();
    }
  }
  //DIbuja el estado actual del juego
  dibujar() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.bola) {
      this.dibujarCasilla(IMG_BOLA, this.bola, "#ffffff");
    }

    this.conga.forEach((parte, indice) => {
      if (indice === 0) {
        this.dibujarCasilla(IMG_CABEZA, parte, "#25f4ee");
      } else {
        this.dibujarCasilla(IMG_PERSONA, parte, "#ff2fb3");
      }
    });
  }

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
     terminar() {
       this.actualizarTiempo();
       this.detener();
       this.alTerminar(this.puntos, this.segundos);
     }
}
