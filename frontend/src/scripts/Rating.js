// =============================================
// RATING.JS - Sistema de calificación de estrellas
// Grow House Ecommerce
// =============================================

console.log('⭐ Inicializando rating.js');

// =============================================
// RENDERIZAR ESTRELLAS (solo lectura) - para tarjetas
// =============================================

function renderStarsReadOnly(average = 0, count = 0) {
    const rounded = Math.round(average * 2) / 2;
    let starsHTML = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rounded)) {
            starsHTML += `<svg class="w-4 h-4 text-yellow-400 fill-current inline-block" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>`;
        } else if (i - 0.5 === rounded) {
            starsHTML += `<svg class="w-4 h-4 inline-block" viewBox="0 0 20 20">
                <defs>
                    <linearGradient id="half-${i}">
                        <stop offset="50%" stop-color="#FBBF24"/>
                        <stop offset="50%" stop-color="#D1D5DB"/>
                    </linearGradient>
                </defs>
                <path fill="url(#half-${i})" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>`;
        } else {
            starsHTML += `<svg class="w-4 h-4 text-gray-300 fill-current inline-block" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>`;
        }
    }

    const countText = count > 0
        ? `<span class="text-gray-500 text-sm ml-1">(${count})</span>`
        : `<span class="text-gray-400 text-sm ml-1">Sin reseñas</span>`;

    return `<div class="flex items-center gap-0.5">${starsHTML}${countText}</div>`;
}

// =============================================
// RENDERIZAR ESTRELLAS INTERACTIVAS - para detalle
// =============================================

async function renderStarsInteractive(productId, average = 0, count = 0) {
    const container = document.getElementById('stars-container');
    if (!container) return;

    // Mostrar el resumen de estrellas de inmediato
    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center gap-3">
                <div id="stars-readonly-detail" class="flex items-center gap-0.5">
                    ${renderStarsReadOnly(average, count)}
                </div>
            </div>
            <div id="rating-interactive-area">
                <div class="flex items-center justify-center py-4">
                    <div class="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <span class="ml-2 text-sm text-gray-400">Verificando calificación...</span>
                </div>
            </div>
        </div>
    `;

    // ✅ Verificar si el usuario ya calificó este producto
    const userRatingData = await checkUserRating(productId);
    renderRatingArea(productId, userRatingData);
}

// =============================================
// VERIFICAR SI EL USUARIO YA CALIFICÓ
// =============================================

async function checkUserRating(productId) {
    const token = localStorage.getItem('growhouse-auth-token');

    // Si no hay sesión, no verificar
    if (!token) return { hasRated: false, userRating: null, isLoggedIn: false };

    try {
        const BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${BASE_URL}/products/${productId}/my-rating`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return { hasRated: false, userRating: null, isLoggedIn: true };

        const data = await response.json();
        return {
            hasRated: data.data.hasRated,
            userRating: data.data.userRating,
            isLoggedIn: true
        };
    } catch (error) {
        console.warn('⚠️ No se pudo verificar calificación previa:', error);
        return { hasRated: false, userRating: null, isLoggedIn: true };
    }
}

// =============================================
// RENDERIZAR ÁREA INTERACTIVA SEGÚN ESTADO
// =============================================

function renderRatingArea(productId, { hasRated, userRating, isLoggedIn }) {
    const area = document.getElementById('rating-interactive-area');
    if (!area) return;

    // Caso 1: Usuario no logueado
    if (!isLoggedIn) {
        area.innerHTML = `
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p class="text-sm text-gray-500 mb-3">Inicia sesión para calificar este producto</p>
                <a href="login.html" class="inline-block px-5 py-2 bg-green-800 text-white text-sm font-semibold rounded-lg hover:bg-green-900 transition-all">
                    Iniciar Sesión
                </a>
            </div>
        `;
        return;
    }

    // Caso 2: Usuario ya calificó — mostrar su calificación bloqueada
    if (hasRated && userRating) {
        area.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-xl p-4">
                <p class="text-sm font-semibold text-green-800 mb-2">✅ Tu calificación</p>
                <div class="flex items-center gap-2">
                    ${[1,2,3,4,5].map(i => `
                        <svg class="w-7 h-7 fill-current ${i <= userRating ? 'text-yellow-400' : 'text-gray-300'}" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                    `).join('')}
                    <span class="text-sm text-green-700 font-medium ml-1">
                        ${ratingLabels[userRating]}
                    </span>
                </div>
                <p class="text-xs text-gray-500 mt-2">Ya calificaste este producto.</p>
            </div>
        `;
        return;
    }

    // Caso 3: Usuario logueado, aún no ha calificado
    area.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-xl p-4">
            <p class="text-sm font-semibold text-gray-700 mb-3">¿Qué te pareció este producto?</p>

            <div class="flex items-center gap-1 mb-3" id="star-selector">
                ${[1,2,3,4,5].map(i => `
                    <button
                        type="button"
                        class="star-btn transition-all duration-150 hover:scale-125 focus:outline-none"
                        data-value="${i}"
                        aria-label="${i} estrellas"
                        onmouseover="highlightStars(${i})"
                        onmouseout="resetStarHighlight()"
                        onclick="selectRating(${i})">
                        <svg class="w-8 h-8 star-icon text-gray-300 fill-current transition-colors duration-150" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                    </button>
                `).join('')}
                <span id="rating-label" class="ml-3 text-sm text-gray-400 italic min-w-[120px]"></span>
            </div>

            <button
                id="submit-rating-btn"
                onclick="submitRating('${productId}')"
                disabled
                class="px-5 py-2 bg-green-800 text-white text-sm font-semibold rounded-lg
                       hover:bg-green-900 transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed">
                Enviar calificación
            </button>

            <p id="rating-feedback" class="mt-2 text-sm hidden"></p>
        </div>
    `;
}

// =============================================
// VARIABLES DE ESTADO
// =============================================

let selectedRating = 0;

const ratingLabels = {
    1: 'Muy malo 😞',
    2: 'Regular 😐',
    3: 'Bueno 🙂',
    4: 'Muy bueno 😊',
    5: '¡Excelente! 🌟'
};

// =============================================
// HOVER / SELECCIÓN DE ESTRELLAS
// =============================================

function highlightStars(upTo) {
    document.querySelectorAll('.star-btn').forEach(btn => {
        const val = Number(btn.dataset.value);
        const icon = btn.querySelector('.star-icon');
        if (val <= upTo) {
            icon.classList.remove('text-gray-300');
            icon.classList.add('text-yellow-400');
        } else {
            icon.classList.add('text-gray-300');
            icon.classList.remove('text-yellow-400');
            if (selectedRating && val <= selectedRating) {
                icon.classList.remove('text-gray-300');
                icon.classList.add('text-yellow-400');
            }
        }
    });
    const label = document.getElementById('rating-label');
    if (label) label.textContent = ratingLabels[upTo] || '';
}

function resetStarHighlight() {
    document.querySelectorAll('.star-btn').forEach(btn => {
        const val = Number(btn.dataset.value);
        const icon = btn.querySelector('.star-icon');
        if (selectedRating && val <= selectedRating) {
            icon.classList.remove('text-gray-300');
            icon.classList.add('text-yellow-400');
        } else {
            icon.classList.add('text-gray-300');
            icon.classList.remove('text-yellow-400');
        }
    });
    const label = document.getElementById('rating-label');
    if (label) label.textContent = selectedRating ? ratingLabels[selectedRating] : '';
}

function selectRating(value) {
    selectedRating = value;
    resetStarHighlight();
    const btn = document.getElementById('submit-rating-btn');
    if (btn) btn.disabled = false;
}

// =============================================
// ENVIAR CALIFICACIÓN AL BACKEND
// =============================================

async function submitRating(productId) {
    if (!selectedRating) return;

    const btn = document.getElementById('submit-rating-btn');
    const feedback = document.getElementById('rating-feedback');

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('growhouse-auth-token');

        const response = await fetch(`${BASE_URL}/products/${productId}/rating`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ rating: selectedRating })
        });

        const data = await response.json();

        if (data.success) {
            // Actualizar resumen de estrellas
            const readonlyEl = document.getElementById('stars-readonly-detail');
            if (readonlyEl) {
                readonlyEl.innerHTML = renderStarsReadOnly(data.data.average, data.data.count);
            }

            // ✅ Reemplazar el selector por la vista de "ya calificado"
            renderRatingArea(productId, {
                hasRated: true,
                userRating: selectedRating,
                isLoggedIn: true
            });

        } else {
            // Si el error es "ya calificó" (por si llegara sin la verificación previa)
            if (data.data && data.data.userRating) {
                renderRatingArea(productId, {
                    hasRated: true,
                    userRating: data.data.userRating,
                    isLoggedIn: true
                });
                return;
            }

            feedback.className = 'mt-2 text-sm text-red-600 font-medium';
            feedback.textContent = `❌ ${data.message || 'No se pudo registrar la calificación'}`;
            feedback.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Enviar calificación';
        }

    } catch (error) {
        console.error('❌ Error al enviar rating:', error);
        const feedback = document.getElementById('rating-feedback');
        if (feedback) {
            feedback.className = 'mt-2 text-sm text-red-600 font-medium';
            feedback.textContent = '❌ Error de conexión. Verifica que el servidor esté activo.';
            feedback.classList.remove('hidden');
        }
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Enviar calificación';
        }
    }
}

console.log('✅ rating.js listo');