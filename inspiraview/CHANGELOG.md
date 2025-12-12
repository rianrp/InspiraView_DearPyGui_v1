# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-12-12

### ✨ Adicionado
- Visualização de imagens com zoom de 10% a 500%
- Controle de opacidade da janela (30% a 100%)
- Suporte a drag & drop de imagens
- Funcionalidade de colar imagens com Ctrl+V
- Atalhos de teclado para navegação rápida
- Interface moderna com tema escuro
- Janela sempre no topo
- Suporte para múltiplos formatos de imagem (PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF)

### 🎨 Design
- Interface minimalista e intuitiva
- Animações suaves e transições elegantes
- Feedback visual para drag & drop
- Tema escuro moderno com gradientes
- Controles responsivos e acessíveis

### ⚡ Performance
- Compilado com Rust para máxima performance
- Baixo consumo de memória (~20-30 MB)
- Inicialização rápida (<1 segundo)
- Executável compacto (~10-15 MB)

### 🔧 Técnico
- Migração de DearPyGui para Tauri
- Frontend em React + TypeScript
- Backend em Rust
- Build system com Vite
- WebView2 para renderização nativa

## [Unreleased]

### 🚀 Planejado
- [ ] Suporte para múltiplas imagens (galeria)
- [ ] Rotação de imagem
- [ ] Filtros e ajustes básicos (brilho, contraste, saturação)
- [ ] Histórico de imagens recentes
- [ ] Temas personalizáveis (claro/escuro)
- [ ] Suporte para GIFs animados
- [ ] Exportar imagem com zoom aplicado
- [ ] Modo fullscreen
- [ ] Comparação lado a lado de imagens
- [ ] Suporte para arrastar a janela pela imagem

---

**Legenda:**
- ✨ Adicionado - para novas funcionalidades
- 🔧 Modificado - para mudanças em funcionalidades existentes
- 🐛 Corrigido - para correção de bugs
- 🗑️ Removido - para funcionalidades removidas
- 🔒 Segurança - para correções de segurança
- 📚 Documentação - para melhorias na documentação
