document.addEventListener("DOMContentLoaded", () => {
    console.log("💬 Chat UI cargado");

    const btn = document.getElementById('chat-toggle');
    const screen = document.getElementById('emergency-screen');

    if (!btn || !screen) {
        console.error("❌ Botón o pantalla del chat no encontrados");
        return;
    }

    // ===============================
    // FUNCIÓN CENTRAL: CERRAR CHAT
    // ===============================
    function cerrarChat() {
        if (screen.classList.contains('active')) {
            screen.classList.remove('active');
            btn.classList.remove('blur');
            btn.style.bottom = '';
            btn.style.right = '';
        }
    }

    // ===============================
    // TOGGLE AL PRESIONAR EL CACTUS
    // ===============================
    btn.addEventListener('click', function(e) {
        e.stopPropagation();

        if (screen.classList.contains('active')) {
            cerrarChat();
        } else {
            screen.classList.add('active');
            btn.classList.add('blur');
            btn.style.bottom = '';
            btn.style.right = '';
        }
    });

    // ===============================
    // CERRAR AL HACER CLIC FUERA
    // ===============================
    document.addEventListener('click', function(e) {
        if (
            screen.classList.contains('active') &&
            !screen.contains(e.target) &&
            !btn.contains(e.target)
        ) {
            cerrarChat();
        }
    });

    // ===============================
    // CERRAR AL PRESIONAR OTRO BOTÓN O ENLACE
    // ===============================
    document.querySelectorAll('a, button').forEach(function(el) {
        if (el.id !== 'chat-toggle' && !screen.contains(el)) {
            el.addEventListener('click', function() {
                cerrarChat();
            });
        }
    });

    // ===============================
    // CERRAR CON TECLA ESCAPE
    // ===============================
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarChat();
        }
    });
});