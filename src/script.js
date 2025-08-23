const { invoke } = window.__TAURI__.tauri;
const { open } = window.__TAURI__.dialog;
const { appWindow } = window.__TAURI__.window;

// Estado da aplicação
let currentZoom = 100;
let currentOpacity = 100;
let imageLoaded = false;

// Elementos DOM
const loadImageBtn = document.getElementById('loadImageBtn');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const resetZoomBtn = document.getElementById('resetZoomBtn');
const displayImage = document.getElementById('displayImage');
const imagePlaceholder = document.getElementById('imagePlaceholder');
const imageArea = document.getElementById('imageArea');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Botão carregar imagem
    loadImageBtn.addEventListener('click', loadImage);
    
    // Controle de opacidade
    opacitySlider.addEventListener('input', function() {
        currentOpacity = parseInt(this.value);
        updateOpacity();
    });
    
    // Controle de zoom
    zoomSlider.addEventListener('input', function() {
        currentZoom = parseInt(this.value);
        updateZoom();
    });
    
    // Reset zoom
    resetZoomBtn.addEventListener('click', resetZoom);
    
    // Atalhos de teclado
    document.addEventListener('keydown', handleKeyDown);
}

async function loadImage() {
    try {
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Images',
                extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff']
            }]
        });

        if (selected) {
            loadImageBtn.textContent = 'Carregando...';
            loadImageBtn.disabled = true;
            
            try {
                const base64Data = await invoke('load_image', { path: selected });
                const mimeType = getMimeType(selected);
                const dataUrl = `data:${mimeType};base64,${base64Data}`;
                
                displayImage.onload = function() {
                    imagePlaceholder.style.display = 'none';
                    displayImage.style.display = 'block';
                    displayImage.classList.add('loaded');
                    imageLoaded = true;
                    
                    // Aplicar zoom atual
                    updateZoom();
                    
                    // Resetar botão
                    loadImageBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        Carregar Imagem
                    `;
                    loadImageBtn.disabled = false;
                };
                
                displayImage.src = dataUrl;
                
            } catch (error) {
                console.error('Erro ao carregar imagem:', error);
                showError('Erro ao carregar imagem: ' + error);
                loadImageBtn.textContent = 'Carregar Imagem';
                loadImageBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Erro ao abrir diálogo:', error);
        loadImageBtn.textContent = 'Carregar Imagem';
        loadImageBtn.disabled = false;
    }
}

function getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff'
    };
    return mimeTypes[ext] || 'image/jpeg';
}

async function updateOpacity() {
    opacityValue.textContent = currentOpacity + '%';
    
    try {
        await invoke('set_window_opacity', { 
            opacity: currentOpacity / 100 
        });
    } catch (error) {
        console.error('Erro ao alterar opacidade:', error);
    }
}

function updateZoom() {
    zoomValue.textContent = currentZoom + '%';
    
    if (imageLoaded) {
        const scale = currentZoom / 100;
        displayImage.style.transform = `scale(${scale})`;
        displayImage.style.transformOrigin = 'center center';
    }
}

function resetZoom() {
    currentZoom = 100;
    zoomSlider.value = 100;
    updateZoom();
}

function handleKeyDown(event) {
    // Ctrl + O para abrir imagem
    if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        loadImage();
    }
    
    // + e - para zoom
    if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        currentZoom = Math.min(500, currentZoom + 10);
        zoomSlider.value = currentZoom;
        updateZoom();
    }
    
    if (event.key === '-') {
        event.preventDefault();
        currentZoom = Math.max(10, currentZoom - 10);
        zoomSlider.value = currentZoom;
        updateZoom();
    }
    
    // R para reset zoom
    if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        resetZoom();
    }
    
    // Esc para fechar
    if (event.key === 'Escape') {
        appWindow.close();
    }
}

function showError(message) {
    // Criar notification toast simples
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e53e3e;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        animation: slideIn 0.3s ease;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// CSS para animações de toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
