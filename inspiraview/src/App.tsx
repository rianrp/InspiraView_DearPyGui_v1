import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Carregar imagem usando input file nativo
  async function loadImage() {
    try {
      setLoading(true);
      
      // Criar input file temporário
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            // Usar FileReader para ler o arquivo como base64
            const reader = new FileReader();
            reader.onload = (event) => {
              setCurrentImage(event.target?.result as string);
              setImageLoaded(true);
              setLoading(false);
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('Erro ao carregar imagem:', error);
            alert('Erro ao carregar imagem: ' + error);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      alert('Erro ao carregar imagem: ' + error);
      setLoading(false);
    }
  }

  // Atualizar opacidade da janela
  async function updateOpacity(newOpacity: number) {
    setOpacity(newOpacity);
    try {
      await invoke('set_window_opacity', { opacity: newOpacity / 100 });
      console.log(`Opacidade definida para: ${newOpacity}%`);
    } catch (error) {
      console.warn('Funcionalidade de opacidade não disponível:', error);
      // Continua funcionando mesmo se a opacidade não funcionar
    }
  }

  // Reset zoom
  function resetZoom() {
    setZoom(100);
  }

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        loadImage();
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoom(prev => Math.min(500, prev + 10));
      }
      if (event.key === '-') {
        event.preventDefault();
        setZoom(prev => Math.max(10, prev - 10));
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Header com controles */}
      <header className="header">
        <div className="controls-row">
          <button 
            className="btn btn-primary" 
            onClick={loadImage}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            {loading ? 'Carregando...' : 'Carregar Imagem'}
          </button>
          
          <div className="control-group">
            <label htmlFor="opacitySlider">Opacidade:</label>
            <input
              type="range"
              id="opacitySlider"
              min="30"
              max="100"
              value={opacity}
              onChange={(e) => updateOpacity(parseInt(e.target.value))}
              className="slider"
            />
            <span className="value-display">{opacity}%</span>
          </div>
        </div>
        
        <div className="controls-row">
          <div className="control-group zoom-controls">
            <label htmlFor="zoomSlider">Zoom:</label>
            <input
              type="range"
              id="zoomSlider"
              min="10"
              max="500"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="slider"
            />
            <span className="value-display">{zoom}%</span>
            <button className="btn btn-secondary" onClick={resetZoom}>
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Área da imagem */}
      <main className="image-container">
        <div className="image-area">
          {!imageLoaded ? (
            <div className="image-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <p>Clique em "Carregar Imagem" para começar</p>
              <p className="shortcuts">
                <small>Atalhos: Ctrl+O (abrir), +/- (zoom), R (reset)</small>
              </p>
            </div>
          ) : (
            <img
              ref={imageRef}
              src={currentImage || ''}
              alt="Imagem carregada"
              className="display-image"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center'
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
