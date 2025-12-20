import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FolderOpen, Clipboard, RotateCcw,
  FlipHorizontal, FlipVertical, Eye, EyeOff,
  Minus, Plus, Trash2, Eraser, Download, Upload, Pin, PinOff,
  Palette, Grid3X3, Sun, MoreHorizontal, Type
} from "lucide-react";
import "./App.css";

// Types
type ItemType = 'image' | 'text';

interface BaseItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  selected: boolean;
  dragOffsetX?: number;
  dragOffsetY?: number;
}

interface ImageItem extends BaseItem {
  type: 'image';
  src: string;
  flipH: boolean;
  flipV: boolean;
  grayscale: boolean;
  guides: boolean;
}

interface TextItem extends BaseItem {
  type: 'text';
  content: string;
  color: string;
  fontSize: number;
  width: number;
}

type CanvasItem = ImageItem | TextItem;

interface Camera {
  x: number;
  y: number;
  scale: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

// Helper: Generate Unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// IndexedDB Wrapper
const dbName = "InspiraViewDB";
const storeName = "scene_v2";

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
};

const saveSceneToDB = async (items: CanvasItem[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(items, "currentScene");
  } catch (e) {
    console.error("Failed to save scene", e);
  }
};

const loadSceneFromDB = async (): Promise<CanvasItem[] | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).get("currentScene");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
};

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
};

function App() {
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [opacity, setOpacity] = useState(100);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Responsive State
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showMobileTools, setShowMobileTools] = useState(false);

  // Interaction States
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);

  // UI States
  const [uiVisible, setUiVisible] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // --- Resize Listener ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Persistence ---
  useEffect(() => {
    const loadState = async () => {
      // Opacity & Pin
      const savedOpacity = localStorage.getItem('inspiraview_opacity');
      if (savedOpacity) {
        const op = parseInt(savedOpacity);
        setOpacity(op);
        try { await invoke('set_window_opacity', { opacity: op / 100 }); } catch { }
      }

      const savedPin = localStorage.getItem('inspiraview_pinned');
      if (savedPin === 'true') {
        setIsPinned(true);
        try { await invoke('set_always_on_top', { alwaysOnTop: true }); } catch { }
      }

      // Scene
      const savedScene = await loadSceneFromDB();
      if (savedScene && savedScene.length > 0) {
        setItems(savedScene);
        const savedCamera = localStorage.getItem('inspiraview_camera');
        if (savedCamera) setCamera(JSON.parse(savedCamera));
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    // If pinned state changed, ensure backend is synced
    // This is redundant with togglePin but good for safety
  }, [isPinned]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length > 0) saveSceneToDB(items);
      else saveSceneToDB([]); // Handle clear

      localStorage.setItem('inspiraview_camera', JSON.stringify(camera));
      localStorage.setItem('inspiraview_opacity', opacity.toString());
      localStorage.setItem('inspiraview_pinned', isPinned.toString());
    }, 1000);
    return () => clearTimeout(timer);
  }, [items, camera, opacity, isPinned]);


  // --- Actions: Scene Management ---
  const handleSaveScene = () => {
    if (items.length === 0) {
      showToast("Nada para salvar!", "info");
      return;
    }
    const data = JSON.stringify(items);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspiraview_scene_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Cena salva com sucesso!", "success");
  };

  const handleLoadScene = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = ev.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            showToast("Cena carregada!", "success");
          } else {
            showToast("Arquivo inválido", "error");
          }
        } catch (err) {
          showToast("Erro ao ler arquivo", "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearScene = () => {
    if (confirm("Tem certeza que deseja limpar tudo?")) {
      setItems([]);
      showToast("Canvas limpo", "info");
    }
  };

  const togglePin = async () => {
    const newState = !isPinned;
    setIsPinned(newState);
    try {
      await invoke('set_always_on_top', { alwaysOnTop: newState });
      showToast(newState ? "Janela Fixada no Topo" : "Fixação Removida", "info");
    } catch (e) {
      console.error(e);
      showToast("Erro ao fixar janela", "error");
    }
  };


  // Helper: Add Items
  const addImage = (dataUrl: string, x: number = 0, y: number = 0) => {
    const newImage: ImageItem = {
      id: generateId(),
      type: 'image',
      src: dataUrl,
      x: (x - camera.x) / camera.scale,
      y: (y - camera.y) / camera.scale,
      scale: 1,
      rotation: 0,
      flipH: false,
      flipV: false,
      grayscale: false,
      guides: false,
      selected: true
    };
    setItems(prev => prev.map(i => ({ ...i, selected: false })).concat(newImage));
    showToast("Imagem adicionada", "success");
  };

  const addText = (x: number = 0, y: number = 0) => {
    let tx = x;
    let ty = y;
    if (tx === 0 && ty === 0 && canvasRef.current) {
      const bounds = canvasRef.current.getBoundingClientRect();
      tx = bounds.width / 2;
      ty = bounds.height / 2;
    }
    const newId = generateId();
    const newText: TextItem = {
      id: newId,
      type: 'text',
      content: "Novo Texto",
      x: (tx - camera.x) / camera.scale,
      y: (ty - camera.y) / camera.scale,
      scale: 1,
      rotation: 0,
      color: "#ffffff",
      fontSize: 32,
      width: 200,
      selected: true
    };
    setItems(prev => prev.map(i => ({ ...i, selected: false })).concat(newText));
    setEditingId(newId); // Enter edit mode immediately
  };


  const processFile = (file: File, clientX?: number, clientY?: number) => {
    if (!file.type.startsWith('image/')) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      let tx = clientX;
      let ty = clientY;
      if (!tx || !ty) {
        const bounds = canvasRef.current?.getBoundingClientRect();
        if (bounds) {
          tx = bounds.width / 2;
          ty = bounds.height / 2;
        }
      }
      addImage(result, tx || 0, ty || 0);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleNativeLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(f => processFile(f));
      }
    };
    input.click();
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          processFile(new File([blob], "paste", { type }));
          return;
        }
      }
      showToast("Nenhuma imagem na área de transferência", "info");
    } catch (e) {
      showToast("Erro ao colar", "error");
    }
  };

  // --- Handlers: Canvas Interaction ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return;

    const target = e.target as HTMLElement;

    // If we click inside an editing text, don't drag
    if (target.isContentEditable) return;

    if (!target.closest('.mobile-tools-popup') && !target.closest('.btn-mobile-trigger')) {
      setShowMobileTools(false);
    }

    if (target.closest('.floating-controls') || target.closest('.context-menu') || target.closest('.mobile-tools-popup') || target.closest('.tool-sidebar')) {
      return;
    }

    if (contextMenu.visible) {
      setContextMenu(prev => ({ ...prev, visible: false }));
    }

    // If clicking logic
    const itemNode = target.closest('.canvas-item');
    if (itemNode) {
      const id = itemNode.getAttribute('data-id');
      if (id) {
        // Handle text editing blur
        if (editingId && editingId !== id) {
          setEditingId(null);
        }

        setIsDraggingItem(true);
        setDragStart({ x: e.clientX, y: e.clientY });

        setItems(prev => prev.map(img => {
          if (img.id === id) {
            return {
              ...img,
              selected: true,
              dragOffsetX: e.clientX,
              dragOffsetY: e.clientY
            };
          }
          return { ...img, selected: e.shiftKey ? img.selected : false };
        }));
      }
    } else {
      // Clicked on background
      setEditingId(null); // Blur text

      // CTRL + Drag = Selection Box
      if (e.ctrlKey) {
        setSelectionBox({
          startX: e.clientX,
          startY: e.clientY,
          currentX: e.clientX,
          currentY: e.clientY
        });
        // Clear selection unless shift? Standard behavior is usually clear
        if (!e.shiftKey) setItems(prev => prev.map(i => ({ ...i, selected: false })));
      } else {
        setIsPanning(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setItems(prev => prev.map(img => ({ ...img, selected: false })));
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const itemNode = target.closest('.canvas-item');

    // If double click on text item -> Edit
    if (itemNode) {
      const id = itemNode.getAttribute('data-id');
      const item = items.find(i => i.id === id);
      if (item && item.type === 'text') {
        setEditingId(item.id);
        return;
      }
    }

    // If double click on background -> Add Text
    if (!target.closest('.canvas-item') && !target.closest('.floating-controls') && !target.closest('.tool-sidebar')) {
      addText(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectionBox) {
      setSelectionBox(prev => prev ? ({ ...prev, currentX: e.clientX, currentY: e.clientY }) : null);
      return;
    }

    if (isPanning) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }

    if (isDraggingItem) {
      const dx = (e.clientX - dragStart.x) / camera.scale;
      const dy = (e.clientY - dragStart.y) / camera.scale;

      setItems(prev => prev.map(img => {
        if (img.selected) {
          return { ...img, x: img.x + dx, y: img.y + dy };
        }
        return img;
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (selectionBox) {
      // Calculate intersection
      if (items.length > 0 && canvasRef.current) {
        // Define Selection Rect
        const sbLeft = Math.min(selectionBox.startX, selectionBox.currentX);
        const sbTop = Math.min(selectionBox.startY, selectionBox.currentY);
        const sbRight = Math.max(selectionBox.startX, selectionBox.currentX);
        const sbBottom = Math.max(selectionBox.startY, selectionBox.currentY);

        // Filter small accidental drags
        if (sbRight - sbLeft > 5 || sbBottom - sbTop > 5) {
          const idsToSelect: string[] = [];
          items.forEach(item => {
            const element = canvasRef.current?.querySelector(`[data-id="${item.id}"]`);
            if (element) {
              const rect = element.getBoundingClientRect();
              // Check overlap
              const overlap = !(rect.right < sbLeft ||
                rect.left > sbRight ||
                rect.bottom < sbTop ||
                rect.top > sbBottom);
              if (overlap) idsToSelect.push(item.id);
            }
          });

          if (idsToSelect.length > 0) {
            setItems(prev => prev.map(i => idsToSelect.includes(i.id) ? { ...i, selected: true } : i));
          }
        }
      }
      setSelectionBox(null);
    }

    setIsPanning(false);
    setIsDraggingItem(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = 1 + (zoomIntensity * direction);

    const mouseX = e.clientX - camera.x;
    const mouseY = e.clientY - camera.y;

    const newScale = Math.max(0.1, Math.min(camera.scale * factor, 20));
    const scaleRatio = newScale / camera.scale;

    const newX = e.clientX - (mouseX * scaleRatio);
    const newY = e.clientY - (mouseY * scaleRatio);

    setCamera({ x: newX, y: newY, scale: newScale });
  };

  useEffect(() => {
    const container = canvasRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [camera]);


  // Helper Updater
  const updateSelected = (updater: (img: CanvasItem) => CanvasItem) => {
    setItems(prev => prev.map(img => img.selected ? updater(img) : img));
  };

  const updateTextContent = (id: string, content: string) => {
    setItems(prev => prev.map(i => i.id === id && i.type === 'text' ? { ...i, content } : i));
  };

  const deleteSelected = () => {
    setItems(prev => prev.filter(img => !img.selected));
  };

  // Keys
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore keys if editing text
      if (editingId) return;

      if (e.key === 'Delete') deleteSelected();
      if (e.key === 'h' || e.key === 'H') updateSelected(img => img.type === 'image' ? ({ ...img, flipH: !img.flipH }) : img);
      if (e.key === 'v' || e.key === 'V') updateSelected(img => img.type === 'image' ? ({ ...img, flipV: !img.flipV }) : img);
      if (e.ctrlKey && e.key === 'ArrowRight') updateSelected(img => ({ ...img, rotation: img.rotation + 90 }));
      if (e.ctrlKey && e.key === 'ArrowLeft') updateSelected(img => ({ ...img, rotation: img.rotation - 90 }));

      if (e.key === 'r' || e.key === 'R') {
        setCamera({ x: 0, y: 0, scale: 1 });
        showToast("Camera Reset", "info");
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setUiVisible(p => !p);
      }
      if (e.ctrlKey && e.key === 'v') handlePaste();
      if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleNativeLoad(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSaveScene(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items, camera, opacity, isPinned, editingId]);

  const toggleOpacity = async (val: number) => {
    setOpacity(val);
    try { await invoke('set_window_opacity', { opacity: val / 100 }); } catch { }
  };

  // Mobile/Responsive Tools
  const ToolsGroup = () => {
    const selectedItem = items.find(i => i.selected);
    if (!selectedItem) return null;

    if (selectedItem.type === 'image') {
      return (
        <>
          <button className="btn-icon" onClick={() => updateSelected(i => i.type === 'image' ? ({ ...i, flipH: !i.flipH }) : i)} data-tooltip="Espelhar H [H]"><FlipHorizontal size={14} /></button>
          <button className="btn-icon" onClick={() => updateSelected(i => i.type === 'image' ? ({ ...i, flipV: !i.flipV }) : i)} data-tooltip="Espelhar V [V]"><FlipVertical size={14} /></button>
          <button className="btn-icon" onClick={() => updateSelected(i => ({ ...i, rotation: i.rotation + 90 }))} data-tooltip="Rotacionar"><RotateCcw size={14} /></button>
          <div className="divider" />
          <button
            className={`btn-icon ${selectedItem.grayscale ? 'text-blue-400' : ''}`}
            onClick={() => updateSelected(i => i.type === 'image' ? ({ ...i, grayscale: !i.grayscale }) : i)}
            data-tooltip="Preto e Branco"
          >
            <Sun size={14} />
          </button>
          <button
            className={`btn-icon ${selectedItem.guides ? 'text-blue-400' : ''}`}
            onClick={() => updateSelected(i => i.type === 'image' ? ({ ...i, guides: !i.guides }) : i)}
            data-tooltip="Guias"
          >
            <Grid3X3 size={14} />
          </button>
          {/* Common Tools */}
          <div className="divider" />
          <button className="btn-icon text-red-400" onClick={deleteSelected} data-tooltip="Deletar [Del]"><Trash2 size={14} /></button>
        </>
      )
    } else {
      // Text Tools
      return (
        <>
          <button className="btn-icon" onClick={() => updateSelected(i => i.type === 'text' ? ({ ...i, fontSize: Math.max(12, i.fontSize - 4) }) : i)} data-tooltip="Diminuir Fonte"><Minus size={14} /></button>
          <span style={{ minWidth: '30px', textAlign: 'center', fontSize: '12px' }}>{selectedItem.fontSize}px</span>
          <button className="btn-icon" onClick={() => updateSelected(i => i.type === 'text' ? ({ ...i, fontSize: Math.min(200, i.fontSize + 4) }) : i)} data-tooltip="Aumentar Fonte"><Plus size={14} /></button>
          <div className="divider" />
          <button
            className="btn-icon"
            onClick={() => {
              const colors = ["#ffffff", "#000000", "#ff5555", "#f1fa8c", "#8be9fd", "#50fa7b"];
              updateSelected(i => {
                if (i.type !== 'text') return i;
                const idx = colors.indexOf(i.color);
                const next = colors[(idx + 1) % colors.length];
                return { ...i, color: next };
              })
            }}
            data-tooltip="Mudar Cor"
            style={{ color: selectedItem.color }}
          >
            <Palette size={14} />
          </button>
          <div className="divider" />
          <button className="btn-icon text-red-400" onClick={deleteSelected} data-tooltip="Deletar [Del]"><Trash2 size={14} /></button>
        </>
      )
    }
  };


  return (
    <div className="app-container" onContextMenu={(e) => {
      e.preventDefault();
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
    }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div
        ref={canvasRef}
        className="image-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const files = Array.from(e.dataTransfer.files);
          files.forEach(f => processFile(f, e.clientX, e.clientY));
        }}
      >
        {/* World */}
        <div
          className="world"
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
            transformOrigin: '0 0'
          }}
        >
          {items.map(item => (
            <div
              key={item.id}
              className={`canvas-item ${item.type} ${item.selected ? 'selected' : ''}`}
              data-id={item.id}
              style={{
                transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg) scale(${item.scale}) ${item.type === 'image' ? `scaleX(${item.flipH ? -1 : 1}) scaleY(${item.flipV ? -1 : 1})` : ''}`,
                zIndex: item.selected ? 100 : 1,
                filter: item.type === 'image' && item.grayscale ? 'grayscale(100%)' : 'none'
              }}
            >
              {item.type === 'image' ? (
                <>
                  <img src={item.src} alt="ref" draggable={false} />
                  {item.guides && (
                    <div className="guides-overlay">
                      <div className="guide-line v-1"></div>
                      <div className="guide-line v-2"></div>
                      <div className="guide-line h-1"></div>
                      <div className="guide-line h-2"></div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="text-content"
                  contentEditable={editingId === item.id}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    updateTextContent(item.id, e.currentTarget.innerText);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => e.stopPropagation()} // Stop delete key etc
                  onMouseDown={(e) => {
                    if (editingId === item.id) e.stopPropagation();
                  }}
                  style={{
                    color: (item as TextItem).color,
                    fontSize: `${(item as TextItem).fontSize}px`,
                    minWidth: '50px',
                    cursor: editingId === item.id ? 'text' : 'grab',
                    userSelect: editingId === item.id ? 'text' : 'none',
                    pointerEvents: 'auto'
                  }}
                >
                  {(item as TextItem).content}
                </div>
              )}
            </div>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <div className="placeholder-overlay pointer-events-none">
            <div className="placeholder-content">
              <h1>InspiraView</h1>
              <p>Arraste imagens ou duplo-clique para texto</p>
              <div className="flex gap-2 justify-center">
                <button className="btn btn-primary pointer-events-auto" onClick={handleNativeLoad}>
                  <FolderOpen size={16} /> Carregar
                </button>
                <button className="btn btn-primary pointer-events-auto" onClick={() => addText()}>
                  <Type size={16} /> Texto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LEFT SIDEBAR - Tools */}
        <div className={`tool-sidebar ${uiVisible ? 'visible' : 'hidden'}`}>
          <button className="btn-icon" onClick={handleNativeLoad} data-tooltip="Carregar Imagem (Ctrl+O)"><FolderOpen size={20} /></button>
          <button className="btn-icon" onClick={() => addText()} data-tooltip="Adicionar Texto (Double Click)"><Type size={20} /></button>
          <button className="btn-icon" onClick={handlePaste} data-tooltip="Colar (Ctrl+V)"><Clipboard size={20} /></button>
          <div className="divider" style={{ height: '1px', width: '100%', margin: '4px 0' }} />
          <button className="btn-icon" onClick={handleSaveScene} data-tooltip="Salvar Cena"><Download size={20} /></button>
          <button className="btn-icon" onClick={handleLoadScene} data-tooltip="Carregar Cena"><Upload size={20} /></button>
          <button className="btn-icon text-red-400" onClick={handleClearScene} data-tooltip="Limpar Tudo"><Eraser size={20} /></button>
        </div>


        {/* BOTTOM BAR - Controls & View */}
        <div className={`floating-controls ${uiVisible ? 'visible' : 'hidden'}`}>

          {/* Camera Group */}
          <div className="control-group">
            <button className="btn-icon" onClick={() => setCamera(p => ({ ...p, scale: p.scale * 0.9 }))} data-tooltip="Zoom Out"><Minus size={14} /></button>
            <span style={{ minWidth: '35px', textAlign: 'center' }}>{Math.round(camera.scale * 100)}%</span>
            <button className="btn-icon" onClick={() => setCamera(p => ({ ...p, scale: p.scale * 1.1 }))} data-tooltip="Zoom In"><Plus size={14} /></button>
          </div>

          <div className="divider" />

          {/* View Group */}
          <div className="control-group">
            <button
              className={`btn-icon ${isPinned ? 'text-blue-400' : ''}`}
              onClick={togglePin}
              data-tooltip={isPinned ? "Desafixar" : "Fixar"}
            >
              {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
            </button>
            {windowWidth > 600 && (
              <>
                <button className="btn-icon" onClick={() => toggleOpacity(Math.max(30, opacity - 10))} data-tooltip="Reduzir Opacidade"><EyeOff size={14} /></button>
                <span style={{ minWidth: '30px', textAlign: 'center' }}>{opacity}%</span>
                <button className="btn-icon" onClick={() => toggleOpacity(Math.min(100, opacity + 10))} data-tooltip="Aumentar Opacidade"><Eye size={14} /></button>
              </>
            )}
          </div>

          {/* Selected Group - RESPONSIVE */}
          {items.some(i => i.selected) && (
            <>
              <div className="divider" />
              {windowWidth < 900 ? (
                <div className="control-group relative" style={{ position: 'relative' }}>
                  <button
                    className={`btn-icon btn-mobile-trigger ${showMobileTools ? 'text-blue-400' : ''}`}
                    onClick={() => setShowMobileTools(p => !p)}
                    data-tooltip="Mais Ferramentas"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {showMobileTools && (
                    <div className="mobile-tools-popup">
                      <ToolsGroup />
                    </div>
                  )}
                </div>
              ) : (
                <div className="control-group">
                  <ToolsGroup />
                </div>
              )}
            </>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="menu-item" onClick={() => { handleNativeLoad(); setContextMenu({ ...contextMenu, visible: false }); }}>
              <FolderOpen size={14} /> Carregar Imagem
            </div>
            <div className="menu-item" onClick={() => { addText(contextMenu.x, contextMenu.y); setContextMenu({ ...contextMenu, visible: false }); }}>
              <Type size={14} /> Adicionar Texto
            </div>
            <div className="menu-item" onClick={() => { handlePaste(); setContextMenu({ ...contextMenu, visible: false }); }}>
              <Clipboard size={14} /> Colar do Clipboard
            </div>
            <div className="menu-divider" />
            <div className="menu-item" onClick={() => { handleClearScene(); setContextMenu({ ...contextMenu, visible: false }); }}>
              <Eraser size={14} /> Limpar Tudo
            </div>
            <div className="menu-divider" />
            <div className="menu-item" onClick={() => { setCamera({ x: 0, y: 0, scale: 1 }); setContextMenu({ ...contextMenu, visible: false }); }}>
              <RotateCcw size={14} /> Resetar Camera
            </div>
            <div className="menu-item" onClick={() => { setUiVisible(p => !p); setContextMenu({ ...contextMenu, visible: false }); }}>
              {uiVisible ? <EyeOff size={14} /> : <Eye size={14} />} {uiVisible ? 'Ocultar UI' : 'Mostrar UI'}
            </div>
          </div>
        )}
      </div>

      {/* Selection Box Render */}
      {selectionBox && (
        <div
          className="selection-box"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY)
          }}
        ></div>
      )}

      {loading && <div className="loading-spinner"><div className="spinner"></div></div>}
    </div>
  );
}

export default App;
