/**
 * BC KINESIOLOGÍA - SISTEMA DE TURNOS Y ADMINISTRACIÓN MÓVIL
 * Funcionalidad lógica completa con persistencia en localStorage.
 */

// Key para el almacenamiento local en el celular
const STORAGE_KEY_TURNOS = 'bc_kinesiologia_turnos';
const STORAGE_KEY_CONFIG = 'bc_kinesiologia_config';

// Configuración inicial por defecto
let appConfig = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG)) || {
  whatsappOficial: "+543881234567",
  administradores: ["+543881234567"]
};

// Estado de la lista de turnos iniciales
let turnosList = JSON.parse(localStorage.getItem(STORAGE_KEY_TURNOS)) || [
  {
    id: 1,
    nombre: "María González",
    whatsapp: "+543881234567",
    diagnostico: "Lumbalgia crónica",
    dolor: "Molestia punzante 7/10 en zona lumbar al sentarse.",
    sesion: "Presencial",
    fecha: "2026-10-15",
    hora: "10:00 hs",
    viaticoUber: 0,
    alertaEnviada: false
  }
];

// Variable global para almacenar el tipo de sesión activo seleccionado
let sesionSeleccionada = 'Presencial';

// Inicialización de la aplicación al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Inicializa los eventos y la sincronización de la app
 */
function initApp() {
  // Sincronizar el número oficial de WhatsApp en el botón flotante
  actualizarEnlaceWhatsApp();

  // Establecer fecha mínima en el selector (hoy)
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.setAttribute('min', hoy);
  }

  // Iniciar temporizador de simulación para alertas de WhatsApp (revisa cada 1 minuto)
  setInterval(verificarAlertas30Minutos, 60000);
}

/**
 * Alterna la vista activa entre Paciente y Administrador
 * @param {string} vista - 'paciente' o 'admin'
 */
function switchView(vista) {
  const viewPaciente = document.getElementById('view-paciente');
  const viewAdmin = document.getElementById('view-admin');
  const tabPaciente = document.getElementById('tab-paciente');
  const tabAdmin = document.getElementById('tab-admin');

  if (vista === 'paciente') {
    viewPaciente.style.display = 'block';
    viewAdmin.style.display = 'none';
    tabPaciente.classList.add('active');
    tabAdmin.classList.remove('active');
  } else if (vista === 'admin') {
    viewPaciente.style.display = 'none';
    viewAdmin.style.display = 'block';
    tabPaciente.classList.remove('active');
    tabAdmin.classList.add('active');
    renderizarAgendaAdmin();
  }
}

/**
 * Maneja la selección visual y lógica del tipo de sesión
 * @param {string} tipo - 'Presencial', 'Online' o 'Domicilio'
 * @param {HTMLElement} cardElement - Elemento HTML contenedor
 */
function selectSession(tipo, cardElement) {
  sesionSeleccionada = tipo;

  // Actualizar estilos de las tarjetas
  document.querySelectorAll('.radio-card').forEach(card => card.classList.remove('selected'));
  cardElement.classList.add('selected');
  cardElement.querySelector('input[type="radio"]').checked = true;

  // Mostrar u ocultar la caja informativa de sesión a domicilio (Uber / Duración)
  const infoDomicilio = document.getElementById('info-domicilio');
  if (infoDomicilio) {
    infoDomicilio.style.display = (tipo === 'Domicilio') ? 'block' : 'none';
  }
}

/**
 * Registra un nuevo turno en el sistema
 */
function confirmBooking() {
  const nombre = document.getElementById('nombre').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.trim();
  const diagnostico = document.getElementById('diagnostico').value.trim();
  const dolor = document.getElementById('dolor').value.trim();
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;

  // Validaciones básicas de campos obligatorios
  if (!nombre || !whatsapp || !fecha) {
    alert("⚠️ Por favor, completa tu Nombre, Número de WhatsApp y Fecha para continuar.");
    return;
  }

  // Creación del nuevo objeto de turno
  const nuevoTurno = {
    id: Date.now(),
    nombre,
    whatsapp,
    diagnostico: diagnostico || "Sin especificar",
    dolor: dolor || "Sin describir",
    sesion: sesionSeleccionada,
    fecha,
    hora,
    viaticoUber: 0,
    alertaEnviada: false
  };

  // Guardar en la lista y en localStorage
  turnosList.push(nuevoTurno);
  guardarTurnosEnStorage();

  // Confirmación al paciente
  alert(`¡Turno reservado con éxito en BC Kinesiología!\n\n📅 Día: ${fecha}\n⏰ Hora: ${hora}\n🏥 Modalidad: ${sesionSeleccionada}`);

  // Limpiar el formulario
  limpiarFormulario();

  // Redirigir al panel admin para ver el turno registrado
  switchView('admin');
}

/**
 * Renderiza la agenda de turnos cargados en el Panel de Administrador
 */
function renderizarAgendaAdmin() {
  const container = document.getElementById('lista-turnos');
  if (!container) return;

  container.innerHTML = "";

  if (turnosList.length === 0) {
    container.innerHTML = "<p style='font-size:14px; color:#666; text-align:center;'>No hay turnos registrados en la agenda.</p>";
    return;
  }

  // Ordenar turnos por fecha y hora
  turnosList.sort((a, b) => new Date(`${a.fecha}T${a.hora.slice(0,5)}`) - new Date(`${b.fecha}T${b.hora.slice(0,5)}`));

  turnosList.forEach(turno => {
    const card = document.createElement('div');
    card.className = 'turno-card';
    card.innerHTML = `
      <div class="turno-time">📅 ${turno.fecha} — ⏰ ${turno.hora}</div>
      <div style="font-weight:bold; font-size:16px; margin:4px 0;">👤 ${turno.nombre}</div>
      <div style="font-size:13px; color:#444;">📋 <strong>Diagnóstico:</strong> ${turno.diagnostico}</div>
      <div style="font-size:13px; color:#444;">⚡ <strong>Descripción del Dolor:</strong> ${turno.dolor}</div>
      <div style="font-size:13px; color:#444;">📞 <strong>WhatsApp:</strong> ${turno.whatsapp}</div>
      <span class="badge-sesion">${turno.sesion}</span>
      ${turno.sesion === 'Domicilio' ? `<div style="margin-top:8px; font-size:12px; color:#C8785E;">🚗 Viático Uber: <strong>$${turno.viaticoUber}</strong> <button onclick="definirViaticoUber(${turno.id})" style="font-size:11px; padding:2px 6px;">Editar</button></div>` : ''}
      <button onclick="eliminarTurno(${turno.id})" style="margin-top:10px; background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer;">Eliminar Turno</button>
    `;
    container.appendChild(card);
  });
}

/**
 * Permite al administrador definir el viático de traslado en Uber
 * @param {number} id - ID del turno
 */
function definirViaticoUber(id) {
  const turno = turnosList.find(t => t.id === id);
  if (turno) {
    const monto = prompt(`Ingrese el monto del viático de traslado en Uber para el paciente ${turno.nombre}:`, turno.viaticoUber);
    if (monto !== null && !isNaN(monto)) {
      turno.viaticoUber = parseFloat(monto);
      guardarTurnosEnStorage();
      renderizarAgendaAdmin();
      alert(`Viático actualizado a $${turno.viaticoUber} y guardado.`);
    }
  }
}

/**
 * Elimina un turno de la lista
 * @param {number} id - ID del turno a eliminar
 */
function eliminarTurno(id) {
  if (confirm("¿Estás seguro de que deseas cancelar/eliminar este turno?")) {
    turnosList = turnosList.filter(t => t.id !== id);
    guardarTurnosEnStorage();
    renderizarAgendaAdmin();
  }
}

/**
 * Agrega un nuevo número celular a la lista de administradores
 */
function addAdmin() {
  const inputPhone = document.getElementById('nuevo-admin-phone');
  const numero = inputPhone ? inputPhone.value.trim() : "";

  if (numero) {
    if (!appConfig.administradores.includes(numero)) {
      appConfig.administradores.push(numero);
      guardarConfigEnStorage();
      alert(`✅ Se le otorgaron permisos de Administrador al número: ${numero}`);
      inputPhone.value = "";
    } else {
      alert("Este número ya cuenta con permisos de administrador.");
    }
  } else {
    alert("Ingresa un número de celular válido.");
  }
}

/**
 * Actualiza el número de WhatsApp oficial del centro
 */
function updateWS() {
  const inputWS = document.getElementById('ws-oficial');
  const nuevoNumero = inputWS ? inputWS.value.trim() : "";

  if (nuevoNumero) {
    appConfig.whatsappOficial = nuevoNumero;
    guardarConfigEnStorage();
    actualizarEnlaceWhatsApp();
    alert("✅ Número de WhatsApp oficial actualizado correctamente.");
  }
}

/**
 * Actualiza la URL del botón flotante de WhatsApp
 */
function actualizarEnlaceWhatsApp() {
  const btnFloat = document.getElementById('ws-float-btn');
  if (btnFloat) {
    const numeroLimpio = appConfig.whatsappOficial.replace(/[^0-9]/g, '');
    btnFloat.href = `https://wa.me/${numeroLimpio}?text=Hola%20BC%20Kinesiología,%20necesito%20asistencia%20con%20un%20turno`;
  }
}

/**
 * Verifica si falta exactamente 30 minutos para algún turno y simula el envío de alerta
 */
function verificarAlertas30Minutos() {
  const ahora = new Date();

  turnosList.forEach(turno => {
    if (turno.alertaEnviada) return;

    // Construir la fecha del turno
    const fechaHoraTurno = new Date(`${turno.fecha}T${turno.hora.slice(0,5)}`);
    const diferenciaMinutos = (fechaHoraTurno - ahora) / (1000 * 60);

    // Si faltan entre 29 y 31 minutos
    if (diferenciaMinutos >= 29 && diferenciaMinutos <= 31) {
      turno.alertaEnviada = true;
      guardarTurnosEnStorage();
      
      console.log(`[ALERTA AUTOMÁTICA] Enviando WhatsApp a ${turno.nombre} (${turno.whatsapp}): "Hola ${turno.nombre} 🌿 Te recordamos que tu sesión en BC Kinesiología comienza en 30 minutos (${turno.hora}). ¡Te esperamos!"`);
    }
  });
}

/**
 * Limpia los campos del formulario tras la reserva
 */
function limpiarFormulario() {
  document.getElementById('nombre').value = "";
  document.getElementById('whatsapp').value = "";
  document.getElementById('diagnostico').value = "";
  document.getElementById('dolor').value = "";
  document.getElementById('fecha').value = "";
}

/**
 * Auxiliares de almacenamiento local
 */
function guardarTurnosEnStorage() {
  localStorage.setItem(STORAGE_KEY_TURNOS, JSON.stringify(turnosList));
}

function guardarConfigEnStorage() {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(appConfig));
}