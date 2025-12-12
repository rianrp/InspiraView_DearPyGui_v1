import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [opacity, setOpacity] = useState(100);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Função auxiliar para processar arquivo de imagem
  const processImageFile = async (file: File) => {
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentImage(event.target?.result as string);
        setImageLoaded(true);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setLoading(false);
    }
  };

  // Carregar imagem da área de transferência
  const loadFromClipboard = async () => {
    try {
      setLoading(true);
      const items = await navigator.clipboard.read();
      
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types.find(type => type.startsWith('image/')) || '');
          const file = new File([blob], 'clipboard-image', { type: blob.type });
          await processImageFile(file);
          return;
        }
      }
      
      alert('Nenhuma imagem encontrada na área de transferência');
      setLoading(false);
    } catch (error) {
      console.error('Erro ao acessar área de transferência:', error);
      alert('Erro ao acessar área de transferência. Verifique as permissões.');
      setLoading(false);
    }
  };

  // Carregar imagem usando input file nativo
  async function loadImage() {
    try {
      setLoading(true);
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await processImageFile(file);
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

  // Handlers para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await processImageFile(imageFile);
    } else {
      alert('Por favor, arraste um arquivo de imagem válido');
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'v') {
        event.preventDefault();
        loadFromClipboard();
      }
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
    <div 
      className="app-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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

          <button 
            className="btn btn-secondary" 
            onClick={loadFromClipboard}
            disabled={loading}
            title="Colar imagem da área de transferência (Ctrl+V)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            Colar (Ctrl+V)
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

        {/* Dicas de uso */}
        <div className="tips">
          <small>
            💡 <strong>Dicas:</strong> Arraste imagens aqui • Ctrl+V para colar • Ctrl+O para abrir • +/- para zoom • R para reset
          </small>
        </div>
      </header>

      {/* Área da imagem */}
      <main className={`image-container ${dragOver ? 'drag-over' : ''}`}>
        <div className="image-area">
          {!imageLoaded ? (
            <div className="image-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <p>📁 Clique em "Carregar Imagem" para começar</p>
              <p>📋 Use Ctrl+V para colar da área de transferência</p>
              <p>🖱️ Ou arraste uma imagem aqui</p>
              <p className="shortcuts">
                <small>Atalhos: Ctrl+O (abrir), Ctrl+V (colar), +/- (zoom), R (reset)</small>
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
