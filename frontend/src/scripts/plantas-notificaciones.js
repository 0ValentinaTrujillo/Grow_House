/**
 * plantas-notificaciones.js
 * Conecta "Mis Plantas" con la campana de notificaciones del navbar.
 * Genera alertas de riego, fertilización, poda y luz según los cuidados
 * registrados en MongoDB para cada planta del usuario.
 */

const API_BASE = 'http://127.0.0.1:5000';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function getToken() {
  return localStorage.getItem('growhouse-auth-token') || null;
}

/**
 * Analiza el texto de un cuidado y devuelve cuántos días aproximados hay
 * entre cada acción. Ej: "cada 3 días" → 3, "semanal" → 7, "mensual" → 30.
 */
function parsearFrecuencia(texto = '') {
  const t = texto.toLowerCase();
  if (/diario|diaria|cada\s*d[ií]a/.test(t))    return 1;
  if (/cada\s*2\s*d/.test(t))                    return 2;
  if (/cada\s*3\s*d/.test(t))                    return 3;
  if (/cada\s*4\s*d/.test(t))                    return 4;
  if (/cada\s*5\s*d/.test(t))                    return 5;
  if (/cada\s*([0-9]+)\s*d/.test(t)) {
    const m = t.match(/cada\s*([0-9]+)\s*d/);
    return parseInt(m[1], 10);
  }
  if (/semanalmente|semanal|cada\s*semana|cada\s*7/.test(t)) return 7;
  if (/quincenal|cada\s*15/.test(t))             return 15;
  if (/mensual|cada\s*mes|cada\s*30/.test(t))    return 30;
  if (/poco|escaso|m[ií]nimo/.test(t))           return 14;  // riego poco frecuente
  if (/moderado|regular/.test(t))                return 7;
  return null; // frecuencia desconocida → sin alerta de fecha
}

/**
 * Genera la lista de notificaciones a partir del array de plantas.
 * Usa localStorage para recordar la última vez que se realizó cada acción.
 */
function generarNotificaciones(plantas) {
  const notifs = [];
  const hoy    = new Date();

  plantas.forEach(planta => {
    const id       = planta._id;
    const nombre   = planta.nombre_comun || 'Tu planta';
    const cuidados = planta.cuidados || {};
    const icono    = planta.imagen ? `<img src="${planta.imagen}" alt="" style="width:28px;height:28px;border-radius:6px;object-fit:cover;flex-shrink:0;">` : '🪴';

    /* ── Riego ── */
    if (cuidados.riego) {
      const frecDias = parsearFrecuencia(cuidados.riego);
      const claveRiego = `zuri_riego_${id}`;
      const ultimoRiego = localStorage.getItem(claveRiego);

      let mostrarRiego = false;
      let diasRestantes = null;

      if (!ultimoRiego) {
        mostrarRiego = true; // nunca regado → recordar
      } else {
        const diff = Math.floor((hoy - new Date(ultimoRiego)) / 86400000);
        if (frecDias && diff >= frecDias) {
          mostrarRiego   = true;
          diasRestantes  = diff - frecDias;
        } else if (frecDias) {
          diasRestantes  = frecDias - diff;
        }
      }

      if (mostrarRiego) {
        notifs.push({
          tipo:    'riego',
          urgente: diasRestantes !== null && diasRestantes > 0,
          icono,
          titulo:  `💧 Riego — ${nombre}`,
          texto:   ultimoRiego
            ? `Hace ${Math.floor((hoy - new Date(ultimoRiego)) / 86400000)} día(s) sin regar.`
            : 'Aún no has registrado el primer riego.',
          accion:  () => marcarRealizado(claveRiego, id, 'riego'),
          claveLS: claveRiego,
          plantaId: id,
          tipo_accion: 'riego',
        });
      } else if (frecDias && diasRestantes !== null && diasRestantes <= 1) {
        // próximo riego mañana → aviso suave
        notifs.push({
          tipo:    'riego-pronto',
          urgente: false,
          icono,
          titulo:  `💧 Riego próximo — ${nombre}`,
          texto:   `Riega mañana (${cuidados.riego}).`,
          accion:  null,
        });
      }
    }

    /* ── Fertilización ── */
    if (cuidados.fertilizacion) {
      const claveF = `zuri_fertilizacion_${id}`;
      const ultimaF = localStorage.getItem(claveF);
      const frecDias = parsearFrecuencia(cuidados.fertilizacion);

      let mostrarF = false;
      if (!ultimaF) {
        mostrarF = true;
      } else if (frecDias) {
        const diff = Math.floor((hoy - new Date(ultimaF)) / 86400000);
        mostrarF = diff >= frecDias;
      }

      if (mostrarF) {
        notifs.push({
          tipo:    'fertilizacion',
          urgente: false,
          icono,
          titulo:  `🌿 Fertilización — ${nombre}`,
          texto:   cuidados.fertilizacion,
          accion:  () => marcarRealizado(claveF, id, 'fertilizacion'),
          claveLS: claveF,
          plantaId: id,
          tipo_accion: 'fertilizacion',
        });
      }
    }

    /* ── Poda ── */
    if (cuidados.poda && /necesita|requiere|regular|periódic/i.test(cuidados.poda)) {
      const claveP = `zuri_poda_${id}`;
      const ultimaP = localStorage.getItem(claveP);
      const frecDias = parsearFrecuencia(cuidados.poda) || 30;

      const mostrarP = !ultimaP ||
        Math.floor((hoy - new Date(ultimaP)) / 86400000) >= frecDias;

      if (mostrarP) {
        notifs.push({
          tipo:    'poda',
          urgente: false,
          icono,
          titulo:  `✂️ Poda — ${nombre}`,
          texto:   cuidados.poda,
          accion:  () => marcarRealizado(claveP, id, 'poda'),
          claveLS: claveP,
          plantaId: id,
          tipo_accion: 'poda',
        });
      }
    }

    /* ── Luz insuficiente (aviso fijo si está registrado) ── */
    if (cuidados.luz && /directa|pleno\s*sol|mucha\s*luz/i.test(cuidados.luz)) {
      const claveL = `zuri_luz_${id}`;
      const ultimaL = localStorage.getItem(claveL);
      // Solo mostramos si no se revisó en los últimos 7 días
      const mostrarL = !ultimaL ||
        Math.floor((hoy - new Date(ultimaL)) / 86400000) >= 7;

      if (mostrarL) {
        notifs.push({
          tipo:    'luz',
          urgente: false,
          icono,
          titulo:  `☀️ Luz — ${nombre}`,
          texto:   `Necesita ${cuidados.luz.toLowerCase()}.`,
          accion:  () => marcarRealizado(claveL, id, 'luz'),
          claveLS: claveL,
          plantaId: id,
          tipo_accion: 'luz',
        });
      }
    }
  });

  // Urgentes primero
  notifs.sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0));
  return notifs;
}

/* ─── Marcar acción como realizada ────────────────────────────────────── */

function marcarRealizado(claveLS, plantaId, tipo) {
  localStorage.setItem(claveLS, new Date().toISOString());
  mostrarToast(`✅ ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado`);
  // Recargar el panel de notificaciones con datos actualizados
  cargarYRenderizarNotificaciones();
}

/* ─── Renderizar el popup ──────────────────────────────────────────────── */

function renderizarPopup(notifs) {
  const popup = document.getElementById('popupNotificaciones');
  if (!popup) return;

  if (!notifs.length) {
    popup.innerHTML = `
      <h3 style="font-weight:600;font-size:1rem;margin-bottom:8px;">Notificaciones</h3>
      <div style="text-align:center;padding:16px 0;color:#6b7280;font-size:0.88rem;">
        <div style="font-size:2rem;margin-bottom:8px;">🌱</div>
        Tus plantas están al día. ¡Buen trabajo!
      </div>`;
    actualizarContadorCampana(0);
    return;
  }

  const items = notifs.map((n, i) => `
    <div style="
      display:flex;align-items:flex-start;gap:10px;
      padding:10px 12px;border-radius:10px;margin-bottom:6px;
      background:${n.urgente ? '#fef2f2' : '#f0fdf4'};
      border:1px solid ${n.urgente ? '#fecaca' : '#bbf7d0'};
      font-size:0.82rem;
    ">
      <div style="flex-shrink:0;margin-top:2px;">${n.icono}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;color:${n.urgente ? '#dc2626' : '#15803d'};margin-bottom:2px;">
          ${n.titulo}
        </div>
        <div style="color:#374151;line-height:1.4;">${n.texto}</div>
        ${n.accion ? `
          <button
            data-notif-index="${i}"
            style="
              margin-top:6px;background:#207719;color:white;border:none;
              padding:4px 12px;border-radius:20px;font-size:0.75rem;
              font-family:'Poppins',sans-serif;cursor:pointer;font-weight:600;
            "
          >Marcar como hecho</button>
        ` : ''}
      </div>
    </div>
  `).join('');

  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <h3 style="font-weight:600;font-size:1rem;">Notificaciones</h3>
      <a href="mis_plantas.html" style="font-size:0.75rem;color:#207719;text-decoration:none;font-weight:600;">
        Ver plantas →
      </a>
    </div>
    <div style="max-height:320px;overflow-y:auto;padding-right:2px;">${items}</div>
  `;

  // Eventos de los botones "Marcar como hecho"
  popup.querySelectorAll('[data-notif-index]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.notifIndex, 10);
      const n   = notifs[idx];
      if (n && n.accion) n.accion();
    });
  });

  actualizarContadorCampana(notifs.filter(n => n.urgente).length || notifs.length);
}

/* ─── Contador en la campana ───────────────────────────────────────────── */

function actualizarContadorCampana(cantidad) {
  const campana = document.getElementById('btnNotificaciones');
  if (!campana) return;

  // Eliminar badge anterior si existe
  const badgeExistente = campana.querySelector('.notif-badge-plantas');
  if (badgeExistente) badgeExistente.remove();

  if (cantidad > 0) {
    const badge = document.createElement('span');
    badge.className = 'notif-badge-plantas';
    badge.textContent = cantidad > 9 ? '9+' : cantidad;
    Object.assign(badge.style, {
      position:        'absolute',
      top:             '-4px',
      right:           '-6px',
      background:      '#dc2626',
      color:           'white',
      fontSize:        '0.65rem',
      fontWeight:      '700',
      borderRadius:    '50%',
      minWidth:        '17px',
      height:          '17px',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontFamily:      "'Poppins', sans-serif",
      pointerEvents:   'none',
    });
    campana.style.position = 'relative';
    campana.appendChild(badge);
  }
}

/* ─── Toast ────────────────────────────────────────────────────────────── */

function mostrarToast(msg) {
  let t = document.getElementById('plantas-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'plantas-toast';
    Object.assign(t.style, {
      position:      'fixed',
      bottom:        '100px',
      left:          '50%',
      transform:     'translateX(-50%) translateY(16px)',
      background:    '#207719',
      color:         'white',
      padding:       '10px 22px',
      borderRadius:  '30px',
      fontSize:      '0.85rem',
      fontWeight:    '600',
      opacity:       '0',
      transition:    'all .35s',
      zIndex:        '99999',
      whiteSpace:    'nowrap',
      fontFamily:    "'Poppins', sans-serif",
      pointerEvents: 'none',
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity   = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity   = '0';
    t.style.transform = 'translateX(-50%) translateY(16px)';
  }, 2500);
}

/* ─── Función principal ─────────────────────────────────────────────────── */

async function cargarYRenderizarNotificaciones() {
  const token = getToken();
  if (!token) return; // sin sesión → sin notificaciones de plantas

  try {
    const res  = await fetch(`${API_BASE}/api/registro`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success || !data.data?.length) {
      renderizarPopup([]);
      return;
    }
    const notifs = generarNotificaciones(data.data);
    renderizarPopup(notifs);
  } catch (err) {
    console.warn('[Plantas Notif] Error al cargar plantas:', err);
  }
}

/* ─── Inicialización ───────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Esperar a que el DOM esté listo y el token disponible
  const init = () => {
    if (!getToken()) return;
    cargarYRenderizarNotificaciones();
  };

  // Pequeño delay para que session.js termine de restaurar el token
  setTimeout(init, 600);

  // Recargar notificaciones cuando se abre el popup de la campana
  const btnNotif = document.getElementById('btnNotificaciones');
  if (btnNotif) {
    btnNotif.addEventListener('click', () => {
      // Solo recargar si el popup ya está visible (lo muestra el script de novedades-notificaciones.js)
      setTimeout(cargarYRenderizarNotificaciones, 50);
    });
  }
});