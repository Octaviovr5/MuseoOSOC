// Bloquear consola
document.addEventListener("keydown", function (event) {
    if (event.key === "F12" || 
        (event.ctrlKey && event.shiftKey && (event.key === "I" || event.key === "J")) || 
        (event.ctrlKey && event.key === "U")) {
        event.preventDefault();
    }
});

// Bloquea la consola
console.log = console.warn = console.error = function() {};
console.debug = function() { return null; };

// Evita `debugger`
setInterval(() => {
    (function() {
        if (window.console && console.log) {
            console.log = function() {};
        }
    })();
}, 1000);

// Variables globales
let gyroPermissionRequested = false;
let viewer, viewerone, viewernt, viewerEn;
let permissionDialogShown = false;
let permissionRequestInProgress = false;

// Section loader
document.addEventListener("DOMContentLoaded", function() {
    let preloader = document.querySelector(".cargador");
    if (!preloader) return;

    let minTime = 6000;
    let startTime = Date.now();

    window.onload = function() {
        let elapsedTime = Date.now() - startTime;
        let remainingTime = minTime - elapsedTime;

        setTimeout(() => {
            preloader.classList.add("hidden");
            setTimeout(() => preloader.remove(), 600);
        }, Math.max(remainingTime, 0));
    };

    // Inicialización diferida para mejor performance
    setTimeout(initGyroPermission, 300);
});

// Gestión de permisos del giroscopio - VERSIÓN CORREGIDA
function initGyroPermission() {
    // Si ya estamos procesando o ya mostramos el diálogo
    if (permissionRequestInProgress || permissionDialogShown) {
        return;
    }

    // Para navegadores que no requieren permiso explícito
    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
        loadPanoramas();
        return;
    }

    // Marcamos que estamos procesando la solicitud
    permissionRequestInProgress = true;
    permissionDialogShown = true;

    // Verificamos si ya existe el overlay
    if (document.getElementById('gyroPermissionOverlay')) {
        permissionRequestInProgress = false;
        return;
    }

    // Interfaz personalizada para solicitar permiso
    const permissionUI = `
        <div id="gyroPermissionOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;
            justify-content:center;align-items:center;color:white;padding:20px;text-align:center;">
            <h2 style="font-size:1.5rem;margin-bottom:1rem;">Experiencia Inmersiva</h2>
            <p style="margin-bottom:2rem;max-width:500px;">Para disfrutar de la experiencia completa, necesitamos acceso a los sensores de movimiento de tu dispositivo.</p>
            <div style="display:flex;gap:15px;">
                <button id="allowGyroBtn" style="padding:12px 25px;background:#4CAF50;color:white;
                    border:none;border-radius:6px;font-size:1rem;cursor:pointer;">Permitir Acceso</button>
                <button id="denyGyroBtn" style="padding:12px 25px;background:#f44336;color:white;
                    border:none;border-radius:6px;font-size:1rem;cursor:pointer;">Continuar Sin Giroscopio</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', permissionUI);

    // Función para manejar la respuesta de permitir
    function handleAllow() {
        gyroPermissionRequested = true;
        permissionRequestInProgress = true;
        document.getElementById('gyroPermissionOverlay').remove();
        
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    loadPanoramas();
                } else {
                    loadPanoramasWithoutGyro();
                }
                permissionRequestInProgress = false;
            })
            .catch(error => {
                console.error("Error al solicitar permiso:", error);
                loadPanoramasWithoutGyro();
                permissionRequestInProgress = false;
            });
    }

    // Función para manejar la respuesta de denegar
    function handleDeny() {
        gyroPermissionRequested = true;
        permissionRequestInProgress = false;
        document.getElementById('gyroPermissionOverlay').remove();
        loadPanoramasWithoutGyro();
    }

    // Asignar event listeners
    document.getElementById('allowGyroBtn').addEventListener('click', handleAllow);
    document.getElementById('denyGyroBtn').addEventListener('click', handleDeny);

    // Limpiar event listeners cuando se remueve el overlay
    const overlay = document.getElementById('gyroPermissionOverlay');
    if (overlay) {
        overlay.addEventListener('DOMNodeRemoved', function() {
            document.getElementById('allowGyroBtn')?.removeEventListener('click', handleAllow);
            document.getElementById('denyGyroBtn')?.removeEventListener('click', handleDeny);
        });
    }
}

// Función para cargar panoramas CON giroscopio
function loadPanoramas() {
    try {
        startPanorama();
        startPanoramaLV();
        startPanoramaLN();
        startPanoramaEn();
    } catch (error) {
        console.error("Error al cargar panoramas:", error);
        loadPanoramasWithoutGyro();
    }
}

// Función para cargar panoramas SIN giroscopio
function loadPanoramasWithoutGyro() {
    try {
        const config = {
            autoLoad: true,
            showZoomCtrl: true,
            showFullscreenCtrl: true,
            yaw: 150,
            hfov: 60,
            pitch: 0,
            autoRotate: 3,
            showControls: true,
            touchPan: true,
            orientationOnByDefault: false,
            compass: false
        };

        viewer = pannellum.viewer('panorama', {
            ...config,
            panorama: "images/panfinal.webp"
        });

        viewerone = pannellum.viewer('panoramalvone', {
            ...config,
            panorama: "images/pb/upanoramica.webp"
        });

        viewernt = pannellum.viewer('panoramaf', {
            ...config,
            panorama: "images/lastlevel/entrada.jpg"
        });

        viewerEn = pannellum.viewer('panoramaentrada', {
            ...config,
            panorama: "images/lastlevel/nt.jpg"
        });

        console.log("Panoramas cargados en modo sin giroscopio");
    } catch (error) {
        console.error("Error al cargar panoramas sin giroscopio:", error);
        showErrorAlert("Hubo un error al cargar la experiencia. Por favor recarga la página.");
    }
}

// Mostrar mensajes de error
function showErrorAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translateX(-50%)';
    alertDiv.style.backgroundColor = '#f44336';
    alertDiv.style.color = 'white';
    alertDiv.style.padding = '15px';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.maxWidth = '80%';
    alertDiv.style.textAlign = 'center';
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 500);
    }, 5000);
}

// Final section text 
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const target = entry.target;
        if (entry.isIntersecting) {
            target.classList.remove('animate__zoomIn');
            target.classList.add('animate__zoomIn', 'animate__delay-1s');
            target.style.opacity = 1;
        } else {
            target.classList.remove('animate__zoomIn');
            target.style.opacity = 0;
        }
    });
}, {
    threshold: 0.5,
    rootMargin: '0px 0px -50px 0px'
});

const animationElement = document.getElementById('animationfinal');
if (animationElement) {
    observer.observe(animationElement);
}

// Section formulario
// Section formulario

document.getElementById("contact-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Evita la recarga de la página

    emailjs.init("TV53dC7ZQsax8xKaF"); // Tu Public Key
    console.log("EmailJS inicializado.");

    const formData = {
        name: document.querySelector("[name='name']").value,
        email: document.querySelector("[name='email']").value,
        date: document.querySelector("[name='date']") ? document.querySelector("[name='date']").value : "Fecha no proporcionada",
        time: document.querySelector("[name='time']").value ,
        personas: document.querySelector("[name='personas']").value ,
        nivel: document.querySelector("[name='nivel']").value ,
        message: document.querySelector("[name='message']").value
    };

    console.log("Datos del formulario:", formData);

    // ✉️ Enviar correo al administrador
    emailjs.send("service_491nysh", "template_ssz7tiq", formData)
    .then(function(response) {
        console.log("Correo enviado al admin:", response);
        
        // ✅ Enviar correo de confirmación al usuario
        return emailjs.send("service_491nysh", "template_gtavlbx", formData);
    })
    .then(function(response) {
        console.log("Correo de confirmación enviado al usuario:", response);
        
        // Mostrar la alerta de éxito con SweetAlert
        Swal.fire({
            title: "¡Éxito!",
            text: "¡Tu visita ha sido agendada! Revisa tu correo. (o bandeja de spam)",
            icon: "success",
            confirmButtonText: "Aceptar"
        });

        document.getElementById("contact-form").reset(); // Limpia el formulario
    })
    .catch(function(error) {
        console.error("Error en EmailJS:", error);
        alert("Hubo un error al enviar los correos.");
    });
});

// Fecha y hora
 // Abrir el selector de fecha automáticamente al hacer clic
 document.getElementById("date").addEventListener("click", function() {
    this.showPicker && this.showPicker(); // algunos navegadores modernos lo soportan
  });

  // Abrir el selector de hora automáticamente al hacer clic
  document.getElementById("time").addEventListener("click", function() {
    this.showPicker && this.showPicker();
  });

// document.getElementById("contact-form")?.addEventListener("submit", function(event) {
//     event.preventDefault();

//     emailjs.init("TV53dC7ZQsax8xKaF");
//     console.log("EmailJS inicializado.");

//     const formData = {
//         name: document.querySelector("[name='name']").value,
//         email: document.querySelector("[name='email']").value,
//         date: document.querySelector("[name='date']")?.value || "Fecha no proporcionada",
//         time: document.querySelector("[name='time']").value,
//         personas: document.querySelector("[name='personas']").value,
//         nivel: document.querySelector("[name='nivel']").value,
//         message: document.querySelector("[name='message']").value
//     };

//     emailjs.send("service_491nysh", "template_ssz7tiq", formData)
//     .then(function(response) {
//         console.log("Correo enviado al admin:", response);
//         return emailjs.send("service_491nysh", "template_gtavlbx", formData);
//     })
//     .then(function(response) {
//         console.log("Correo de confirmación enviado al usuario:", response);
        
//         Swal.fire({
//             title: "¡Éxito!",
//             text: "¡Tu visita ha sido agendada! Revisa tu correo.",
//             icon: "success",
//             confirmButtonText: "Aceptar"
//         });

//         document.getElementById("contact-form").reset();
//     })
//     .catch(function(error) {
//         console.error("Error en EmailJS:", error);
//         showErrorAlert("Hubo un error al enviar el formulario. Por favor intenta nuevamente.");
//     });
// });

// OPTIMIZACIÓN PARA DISPOSITIVOS MÓVILES
function disableAnimationsOnMobile() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && window.innerWidth <= 768) {
        document.querySelectorAll('.wow, [class*="animate__"]').forEach(element => {
            element.classList.remove('wow', 'animate__animated');
            
            element.classList.forEach(cls => {
                if (cls.startsWith('animate__')) {
                    element.classList.remove(cls);
                }
            });

            element.removeAttribute('data-wow-delay');
            element.removeAttribute('data-wow-duration');
            element.removeAttribute('data-wow-offset');
        });

        const animateCSS = document.querySelector('link[href*="animate.min.css"]');
        if (animateCSS) animateCSS.remove();

        if (typeof WOW !== 'undefined') {
            WOW.prototype.init = function() { return false; };
        }
    }
}

window.addEventListener('load', disableAnimationsOnMobile);
window.addEventListener('resize', disableAnimationsOnMobile);

// Control de videos
function setupVideoControls() {
    // Video fachada
    document.getElementById('fullscreenBtn')?.addEventListener('click', function() {
        const video = document.getElementById('videntrada');
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
    });

    // Video lv
    document.getElementById('fullscreenBtnLv')?.addEventListener('click', function() {
        const video = document.getElementById('videolv');
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
    });

    // Video cine
    const videoCn = document.getElementById('videocn');
    if (videoCn) videoCn.playbackRate = 0.65;
    
    document.getElementById('fullscreenBtnCn')?.addEventListener('click', function() {
        if (videoCn.requestFullscreen) videoCn.requestFullscreen();
        else if (videoCn.webkitRequestFullscreen) videoCn.webkitRequestFullscreen();
        else if (videoCn.msRequestFullscreen) videoCn.msRequestFullscreen();
    });

    // Video tienda
    document.getElementById('fullscreenBtnPreludio')?.addEventListener('click', function() {
        const video = document.getElementById('videopreludio');
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
    });
}

// Section Carrusel
function initCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    const cards = track.children;
    let currentPosition = 0;
    let cardWidth;
    let autoScrollInterval;

    function updateCarousel() {
        cardWidth = cards[0].offsetWidth;
        track.style.transition = 'none';
        track.style.transform = `translateX(0px)`;
        currentPosition = 0;
        setTimeout(() => {
            track.style.transition = 'transform 0.5s ease';
        }, 50);
    }

    function moveNext() {
        currentPosition -= cardWidth;
        track.style.transform = `translateX(${currentPosition}px)`;

        if (Math.abs(currentPosition) >= cardWidth * (cards.length / 2)) {
            setTimeout(() => {
                track.style.transition = 'none';
                currentPosition = 0;
                track.style.transform = `translateX(0px)`;
                setTimeout(() => {
                    track.style.transition = 'transform 0.5s ease';
                }, 50);
            }, 500);
        }
    }

    function startAutoScroll() {
        autoScrollInterval = setInterval(moveNext, 3000);
    }

    track.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
    track.addEventListener('mouseleave', startAutoScroll);

    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentPosition += cardWidth;
            track.style.transform = `translateX(${currentPosition}px)`;
            
            if (currentPosition > 0) {
                setTimeout(() => {
                    track.style.transition = 'none';
                    currentPosition = -cardWidth * (cards.length / 2);
                    track.style.transform = `translateX(${currentPosition}px)`;
                    setTimeout(() => {
                        track.style.transition = 'transform 0.5s ease';
                    }, 50);
                }, 500);
            }
        });

        nextBtn.addEventListener('click', moveNext);
    }

    updateCarousel();
    startAutoScroll();
    window.addEventListener('resize', updateCarousel);
}

// Inicialización completa
window.addEventListener('load', function() {
    setupVideoControls();
    initCarousel();
});