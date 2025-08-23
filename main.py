import dearpygui.dearpygui as dpg
from PIL import Image
import numpy as np
import io
from tkinter import filedialog, Tk

dpg.create_context()
dpg.create_viewport(title='InspiraView', width=320, height=380, always_on_top=True)
dpg.setup_dearpygui()

# Placeholder da imagem
texture_id = None
zoom_factor = 1.0
original_width = 0
original_height = 0

def carregar_imagem_callback():
    global texture_id, original_width, original_height, zoom_factor
    Tk().withdraw()
    path = filedialog.askopenfilename(filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.webp")])
    if path:
        try:
            img = Image.open(path).convert("RGBA")
            # Salvar dimensões originais
            original_width, original_height = img.size
            width, height = img.size
            
            # Converter para array numpy e normalizar para 0-1
            img_array = np.array(img, dtype=np.float32) / 255.0
            # DearPyGui espera dados como lista flat de floats
            img_data = img_array.flatten().tolist()

            # Criar a textura
            with dpg.texture_registry(show=False):
                if dpg.does_item_exist("imagem_selecionada"):
                    dpg.delete_item("imagem_selecionada")
                texture_id = dpg.add_static_texture(width, height, img_data, tag="imagem_selecionada")

            # Substituir imagem visível
            if dpg.does_item_exist("img_display"):
                dpg.delete_item("img_display")
            
            # Aplicar zoom inicial
            display_width = int(original_width * zoom_factor)
            display_height = int(original_height * zoom_factor)
            dpg.add_image("imagem_selecionada", tag="img_display", parent="image_holder", 
                         width=display_width, height=display_height)
            
            # Atualizar slider de zoom
            dpg.set_value("zoom_slider", int(zoom_factor * 100))
            
            # Ajustar tamanho da janela se necessário
            atualizar_tamanho_janela()

        except Exception as e:
            print(f"Erro ao carregar imagem: {str(e)}")

def atualizar_zoom(sender, app_data, user_data):
    global zoom_factor, original_width, original_height
    zoom_factor = app_data / 100.0
    
    # Atualizar texto do zoom
    dpg.set_value("zoom_text", f"{app_data}%")
    
    if dpg.does_item_exist("img_display") and original_width > 0:
        display_width = int(original_width * zoom_factor)
        display_height = int(original_height * zoom_factor)
        dpg.configure_item("img_display", width=display_width, height=display_height)
        atualizar_tamanho_janela()

def atualizar_tamanho_janela():
    if original_width > 0 and original_height > 0:
        # Calcular novo tamanho da janela baseado na imagem com zoom + controles
        display_width = int(original_width * zoom_factor)
        display_height = int(original_height * zoom_factor)
        
        # Adicionar espaço para os controles (botão, sliders, etc.)
        window_width = max(320, display_width + 40)  # mínimo 320, +40 para margens
        window_height = display_height + 120  # +120 para controles
        
        # Limitar tamanho máximo da tela
        max_width = 1200
        max_height = 800
        
        if window_width > max_width:
            window_width = max_width
        if window_height > max_height:
            window_height = max_height
            
        dpg.configure_item("MainWindow", width=window_width, height=window_height)
        dpg.set_viewport_width(window_width)
        dpg.set_viewport_height(window_height)

def resetar_zoom():
    global zoom_factor
    zoom_factor = 1.0
    dpg.set_value("zoom_slider", 100)
    atualizar_zoom(None, 100, None)

def atualizar_opacidade(sender, app_data, user_data):
    dpg.set_viewport_alpha(app_data / 100)

with dpg.window(tag="MainWindow", no_title_bar=True, no_resize=False, no_collapse=True):
    dpg.add_button(label="Carregar Imagem", callback=carregar_imagem_callback)
    
    # Controles de zoom
    with dpg.group(horizontal=True):
        dpg.add_text("Zoom:")
        dpg.add_slider_int(label="##zoom", min_value=10, max_value=500, default_value=100, 
                          callback=atualizar_zoom, tag="zoom_slider", width=150)
        dpg.add_text("100%", tag="zoom_text")
        dpg.add_button(label="Reset", callback=lambda: resetar_zoom())
    
    dpg.add_slider_int(label="Opacidade (%)", min_value=30, max_value=100, default_value=100, callback=atualizar_opacidade)
    
    # Container com scroll para a imagem
    with dpg.child_window(
        tag="scroll_area",
        no_scrollbar=False,       # mantém barras ativas
        horizontal_scrollbar=True # só existe essa flag explícita
        # defina width/height para forçar overflow e ver as barras
        # width=320, height=300
    ):
        dpg.add_group(tag="image_holder")  # grupo onde a imagem será inserida depois

dpg.set_primary_window("MainWindow", True)
dpg.show_viewport()
dpg.start_dearpygui()
dpg.destroy_context()
