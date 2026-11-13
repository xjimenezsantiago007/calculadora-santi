/* =========================================================
   1. VARIABLES
   Aquí guardo lo que la calculadora necesita "recordar".
   ========================================================= */
let numeroActual = "0";       // el número que se está escribiendo
let numeroAnterior = "";      // el primer número de la operación (ej: el 120 de 120 + 45)
let operador = "";            // el operador elegido (+, −, ×, ÷, ^)
let textoOperacion = "";      // texto pequeño de arriba (ej: "√(9)")
let acabaDeCalcular = false;  // true cuando se acaba de mostrar un resultado
let mensajeError = "";        // si hay un error, se guarda aquí el mensaje

// Pedazos de la página que vamos a modificar
const pantallaResultado = document.getElementById("resultado");
const pantallaOperacion = document.getElementById("operacion");

/* =========================================================
   2. MOSTRAR LAS COSAS EN LA PANTALLA
   ========================================================= */
// Le pone comas a los miles solo para mostrarlo (ej: 32600 -> 32,600).
// Por dentro el número sigue siendo normal, así las cuentas no se dañan.
function ponerComas(texto) {
  return texto.replace(/\d+(\.\d*)?/g, function (numero) {
    let partes = numero.split(".");
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return partes.join(".");
  });
}

function actualizarPantalla() {
  // Si hay error mostramos el error; si no, el número actual
  let texto = ponerComas(mensajeError || numeroActual || numeroAnterior);
  pantallaResultado.textContent = texto;

  // Si el número es muy largo lo hacemos más pequeño
  pantallaResultado.classList.toggle("largo", texto.length > 10 && !mensajeError);
  pantallaResultado.classList.toggle("error", mensajeError !== "");

  // Línea pequeña de arriba
  if (operador !== "") {
    pantallaOperacion.textContent = ponerComas(numeroAnterior) + " " + operador;
  } else {
    pantallaOperacion.textContent = ponerComas(textoOperacion);
  }
}

// Redondea para evitar cosas raras como 0.1 + 0.2 = 0.30000000000000004
function limpiarNumero(numero) {
  return String(Math.round(numero * 1e10) / 1e10);
}

function mostrarError(mensaje) {
  numeroActual = "0";
  numeroAnterior = "";
  operador = "";
  textoOperacion = "";
  mensajeError = mensaje;
}

/* =========================================================
   3. ESCRIBIR NÚMEROS
   ========================================================= */
function agregarNumero(digito) {
  // Si acabamos de calcular, empezamos de cero
  if (acabaDeCalcular) {
    numeroActual = "0";
    textoOperacion = "";
    acabaDeCalcular = false;
  }

  // Si estaba esperando el segundo número, empezamos limpio
  if (numeroActual === "") {
    numeroActual = "0";
  }

  // No permitir dos puntos en el mismo número
  if (digito === "." && numeroActual.includes(".")) {
    return;
  }

  // Si hay un 0 solo, lo reemplazamos (para no tener 05)
  if (numeroActual === "0" && digito !== ".") {
    numeroActual = digito;
  } else {
    numeroActual = numeroActual + digito;
  }
}

/* =========================================================
   4. OPERACIONES BÁSICAS
   ========================================================= */
function elegirOperador(nuevoOperador) {
  // Si apretó dos operadores seguidos, solo cambiamos el operador
  if (numeroActual === "") {
    operador = nuevoOperador;
    return;
  }

  // Si ya había una operación pendiente (ej: 2 + 3 +), la resolvemos primero
  if (operador !== "") {
    calcular();
    if (mensajeError !== "") return;
  }

  numeroAnterior = numeroActual;
  operador = nuevoOperador;
  numeroActual = "";
  textoOperacion = "";
  acabaDeCalcular = false;
}

// Hace la cuenta entre numeroAnterior y numeroActual
function calcular() {
  if (operador === "" || numeroActual === "") {
    return;
  }

  let a = parseFloat(numeroAnterior);
  let b = parseFloat(numeroActual);
  let resultado = 0;

  switch (operador) {
    case "+": resultado = a + b; break;
    case "−": resultado = a - b; break;
    case "×": resultado = a * b; break;
    case "÷":
      if (b === 0) {
        mostrarError("No se puede dividir entre 0");
        return;
      }
      resultado = a / b;
      break;
    case "^": resultado = Math.pow(a, b); break;
  }

  if (!isFinite(resultado)) {
    mostrarError("Resultado no válido");
    return;
  }

  // Guardamos la operación completa para mostrarla arriba
  const textoCuenta = numeroAnterior + " " + operador + " " + numeroActual;
  textoOperacion = textoCuenta + " =";
  numeroActual = limpiarNumero(resultado);
  guardarEnHistorial(textoCuenta, numeroActual);
  numeroAnterior = "";
  operador = "";
}

function presionarIgual() {
  calcular();
  acabaDeCalcular = true;
}

/* =========================================================
   5. BORRAR
   ========================================================= */
function borrarTodo() {
  numeroActual = "0";
  numeroAnterior = "";
  operador = "";
  textoOperacion = "";
  acabaDeCalcular = false;
}

function borrarUno() {
  if (numeroActual === "" || acabaDeCalcular) return;

  // Si queda un solo dígito (o "-5"), volvemos a 0
  if (numeroActual.length === 1 || (numeroActual.length === 2 && numeroActual[0] === "-")) {
    numeroActual = "0";
  } else {
    numeroActual = numeroActual.slice(0, -1);
  }
}

/* =========================================================
   6. FUNCIONES CIENTÍFICAS
   Se aplican directo al número que está en pantalla.
   Los ángulos (sin, cos, tan) se usan en GRADOS.
   ========================================================= */
function aplicarFuncion(nombre) {
  // π no necesita número previo, así que va aparte
  if (nombre === "pi") {
    numeroActual = limpiarNumero(Math.PI);
    textoOperacion = "π";
    acabaDeCalcular = true;
    return;
  }

  if (numeroActual === "") return;

  let x = parseFloat(numeroActual);
  let resultado = 0;
  let texto = "";
  let radianes = x * Math.PI / 180; // convertimos grados a radianes

  switch (nombre) {
    case "sin":
      resultado = Math.sin(radianes);
      texto = "sin(" + x + "°)";
      break;
    case "cos":
      resultado = Math.cos(radianes);
      texto = "cos(" + x + "°)";
      break;
    case "tan":
      resultado = Math.tan(radianes);
      texto = "tan(" + x + "°)";
      // tan de 90° no existe
      if (Math.abs(Math.cos(radianes)) < 1e-12) {
        mostrarError("tan no existe en ese ángulo");
        return;
      }
      break;
    case "log":
      if (x <= 0) { mostrarError("log solo de números mayores a 0"); return; }
      resultado = Math.log10(x);
      texto = "log(" + x + ")";
      break;
    case "ln":
      if (x <= 0) { mostrarError("ln solo de números mayores a 0"); return; }
      resultado = Math.log(x);
      texto = "ln(" + x + ")";
      break;
    case "raiz":
      if (x < 0) { mostrarError("No hay raíz de un negativo"); return; }
      resultado = Math.sqrt(x);
      texto = "√(" + x + ")";
      break;
    case "cuadrado":
      resultado = x * x;
      texto = "(" + x + ")²";
      break;
    case "inverso":
      if (x === 0) { mostrarError("No se puede dividir entre 0"); return; }
      resultado = 1 / x;
      texto = "1/(" + x + ")";
      break;
    case "porcentaje":
      resultado = x / 100;
      texto = x + "%";
      break;
    case "signo":
      // Solo cambia el signo, no cuenta como cálculo nuevo
      numeroActual = limpiarNumero(-x);
      return;
  }

  numeroActual = limpiarNumero(resultado);
  textoOperacion = texto;
  acabaDeCalcular = true;
  guardarEnHistorial(texto, numeroActual);
}

/* =========================================================
   7. CLICS DE LOS BOTONES
   Un solo "oyente" revisa qué botón se presionó
   mirando sus atributos data-...
   ========================================================= */
document.getElementById("botones").addEventListener("click", function (evento) {
  const boton = evento.target.closest("button");
  if (!boton) return;

  mensajeError = ""; // al presionar algo, se quita el error anterior

  if (boton.dataset.num !== undefined) {
    agregarNumero(boton.dataset.num);
  } else if (boton.dataset.op !== undefined) {
    elegirOperador(boton.dataset.op);
  } else if (boton.dataset.fun !== undefined) {
    aplicarFuncion(boton.dataset.fun);
  } else if (boton.dataset.accion === "igual") {
    presionarIgual();
  } else if (boton.dataset.accion === "borrarTodo") {
    borrarTodo();
  } else if (boton.dataset.accion === "borrarUno") {
    borrarUno();
  }

  actualizarPantalla();
});

/* =========================================================
   8. MOSTRAR / OCULTAR PANEL CIENTÍFICO
   ========================================================= */
document.getElementById("botonModo").addEventListener("click", function () {
  document.getElementById("panelCientifico").classList.toggle("oculta");
});

/* =========================================================
   9. TECLADO
   Para poder usar la calculadora con el teclado del computador.
   ========================================================= */
document.addEventListener("keydown", function (evento) {
  const tecla = evento.key;
  mensajeError = "";

  if ("0123456789.".includes(tecla)) {
    agregarNumero(tecla);
  } else if (tecla === "+") {
    elegirOperador("+");
  } else if (tecla === "-") {
    elegirOperador("−");
  } else if (tecla === "*") {
    elegirOperador("×");
  } else if (tecla === "/") {
    evento.preventDefault(); // evita que el navegador abra la búsqueda rápida
    elegirOperador("÷");
  } else if (tecla === "Enter" || tecla === "=") {
    evento.preventDefault();
    presionarIgual();
  } else if (tecla === "Backspace") {
    borrarUno();
  } else if (tecla === "Escape") {
    borrarTodo();
  } else {
    return; // cualquier otra tecla no hace nada
  }

  actualizarPantalla();
});

/* =========================================================
   10. HISTORIAL
   Guarda las últimas 50 operaciones y las muestra en el panel.
   Se queda guardado aunque cierres la página.
   ========================================================= */
let historial = leerGuardado("historialSanti", []);

// Guardar y leer del navegador (con try por si el navegador no deja)
function leerGuardado(clave, porDefecto) {
  try {
    const valor = localStorage.getItem(clave);
    return valor ? JSON.parse(valor) : porDefecto;
  } catch (e) {
    return porDefecto;
  }
}

function guardarDato(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
}

function guardarEnHistorial(operacion, resultado) {
  historial.unshift({ operacion: operacion, resultado: resultado });
  historial = historial.slice(0, 50);
  guardarDato("historialSanti", historial);
  dibujarHistorial();
}

function dibujarHistorial() {
  const lista = document.getElementById("listaHistorial");
  lista.innerHTML = "";

  if (historial.length === 0) {
    lista.innerHTML = '<li class="vacio">Aún no hay operaciones</li>';
    return;
  }

  historial.forEach(function (item) {
    const li = document.createElement("li");
    li.innerHTML = "<small></small><b></b>";
    li.querySelector("small").textContent = ponerComas(item.operacion) + " =";
    li.querySelector("b").textContent = ponerComas(item.resultado);

    // Al hacer clic, el resultado vuelve a la pantalla para seguir usándolo
    li.addEventListener("click", function () {
      mensajeError = "";
      numeroActual = item.resultado;
      acabaDeCalcular = true;
      actualizarPantalla();
      document.getElementById("historial").classList.remove("abierto");
    });

    lista.appendChild(li);
  });
}

document.getElementById("botonHistorial").addEventListener("click", function () {
  document.getElementById("historial").classList.add("abierto");
});
document.getElementById("botonCerrar").addEventListener("click", function () {
  document.getElementById("historial").classList.remove("abierto");
});
document.getElementById("botonLimpiar").addEventListener("click", function () {
  historial = [];
  guardarDato("historialSanti", historial);
  dibujarHistorial();
});

// Al abrir la página: historial guardado y el 0 inicial
dibujarHistorial();
actualizarPantalla();
