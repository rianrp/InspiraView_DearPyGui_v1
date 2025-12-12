# 🖼️ InspiraView

Uma aplicação moderna e leve para visualização de imagens com overlay, construída com **Tauri** + **React** + **TypeScript**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-2.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## ✨ Funcionalidades

- 🖼️ **Visualização de imagens** - Suporte para PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF
- 🔍 **Controle de Zoom** - Ajuste de 10% a 500%
- 👁️ **Controle de Opacidade** - Transparência da janela de 30% a 100%
- 📌 **Sempre no Topo** - Janela permanece sobre outras aplicações
- 🖱️ **Drag & Drop** - Arraste imagens diretamente para a janela
- 📋 **Clipboard** - Cole imagens com Ctrl+V
- ⌨️ **Atalhos de Teclado** - Navegação rápida e intuitiva
- 🎨 **Interface Moderna** - Design minimalista com tema escuro
- ⚡ **Performance** - Baixo consumo de memória e CPU
- 📦 **Executável Único** - Sem dependências externas

## 🎯 Casos de Uso

- 🎨 **Designers** - Visualizar referências enquanto trabalha
- 💻 **Desenvolvedores** - Comparar designs com código
- 📸 **Fotógrafos** - Visualizar fotos rapidamente
- 🎮 **Gamers** - Overlay de mapas e guias
- 📚 **Estudantes** - Visualizar diagramas e anotações

## 🚀 Instalação e Uso

### Pré-requisitos

- **Windows 10/11** (64-bit)
- **Rust** 1.70+ - [Instalar](https://rustup.rs/)
- **Node.js** 18+ - [Instalar](https://nodejs.org/)

### Instalação de Dependências

```powershell
# Clone ou baixe o repositório
cd inspiraview

# Instale as dependências Node.js
npm install
```

### Executar em Desenvolvimento

```powershell
# Iniciar aplicação em modo desenvolvimento
npm run tauri dev
```

A primeira execução pode demorar alguns minutos enquanto o Rust compila as dependências.

### Compilar para Produção

```powershell
# Compilar executável otimizado
npm run tauri build
```

**Localização do executável:**
- `src-tauri/target/release/inspiraview.exe` (~10-15MB)
- `src-tauri/target/release/bundle/msi/` (Instalador Windows)

## 🎮 Como Usar

### Carregar Imagens

| Método | Ação |
|--------|------|
| **Botão** | Clique em "📁 Carregar Imagem" |
| **Atalho** | Pressione `Ctrl+O` |
| **Drag & Drop** | Arraste uma imagem para a janela |
| **Clipboard** | Copie uma imagem e pressione `Ctrl+V` ou clique em "📋 Colar" |

### Controles

| Controle | Função | Atalho |
|----------|--------|--------|
| **Zoom In** | Aumentar zoom | `+` ou `=` |
| **Zoom Out** | Diminuir zoom | `-` |
| **Reset Zoom** | Voltar para 100% | `R` |
| **Abrir Imagem** | Selecionar arquivo | `Ctrl+O` |
| **Colar** | Da área de transferência | `Ctrl+V` |

### Sliders

- **🔍 Zoom**: Ajuste preciso de 10% a 500%
- **👁️ Opacidade**: Transparência da janela de 30% a 100%

## 📁 Estrutura do Projeto

```
inspiraview/
├── src/                          # Frontend React
│   ├── App.tsx                   # Componente principal
│   ├── App.css                   # Estilos da aplicação
│   ├── main.tsx                  # Entry point React
│   └── index.html                # HTML base
│
├── src-tauri/                    # Backend Tauri/Rust
│   ├── src/
│   │   └── lib.rs                # Lógica Rust
│   ├── icons/                    # Ícones da aplicação
│   ├── Cargo.toml                # Dependências Rust
│   └── tauri.conf.json           # Configurações Tauri
│
├── package.json                  # Dependências Node.js
├── tsconfig.json                 # Configuração TypeScript
├── vite.config.ts                # Configuração Vite
└── README.md                     # Este arquivo
```

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **Vite** - Build tool moderna
- **CSS3** - Estilização

### Backend
- **Tauri 2.0** - Framework desktop
- **Rust** - Performance e segurança
- **WebView2** - Renderização nativa

## ⚙️ Configuração

### Tauri Config (`src-tauri/tauri.conf.json`)

```json
{
  "productName": "InspiraView",
  "version": "1.0.0",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{
      "title": "InspiraView",
      "width": 800,
      "height": 600,
      "alwaysOnTop": true,
      "decorations": true,
      "transparent": true
    }]
  }
}
```

## 🐛 Solução de Problemas

### Erro: "Rust não encontrado"
```powershell
# Instale o Rust
https://rustup.rs/

# Adicione ao PATH (reinicie o terminal)
```

### Erro: "npm não encontrado"
```powershell
# Instale o Node.js
https://nodejs.org/
```

### Erro de compilação Rust
```powershell
# Limpe o cache e recompile
cd src-tauri
cargo clean
cd ..
npm run tauri dev
```

### Janela não aparece
```powershell
# Verifique se há outra instância rodando
# Feche e tente novamente
```

### Erro de crypto.getRandomValues (Vite)
```powershell
# Atualize o Node.js para versão 18 ou superior
# Limpe o cache
npm cache clean --force
rm -rf node_modules
npm install
```

## 🔧 Desenvolvimento

### Adicionar Novos Recursos

1. **Frontend (React)**: Edite `src/App.tsx`
2. **Backend (Rust)**: Edite `src-tauri/src/lib.rs`
3. **Estilos**: Edite `src/App.css`

### Hot Reload

O projeto usa hot-reload automático:
- **Frontend**: Vite detecta mudanças em `src/`
- **Backend**: Tauri recompila mudanças em `src-tauri/src/`

### Comandos Úteis

```powershell
# Desenvolvimento
npm run tauri dev

# Build de produção
npm run tauri build

# Limpar cache
npm cache clean --force
cd src-tauri
cargo clean

# Atualizar dependências
npm update
cd src-tauri
cargo update
```

## 📊 Performance

| Métrica | Valor |
|---------|-------|
| **Tamanho executável** | ~10-15 MB |
| **Uso de RAM** | ~20-30 MB |
| **Tempo de inicialização** | <1 segundo |
| **Uso de CPU (idle)** | <1% |

## 🔒 Segurança

- ✅ Código Rust verificado em compile-time
- ✅ Sem dependências externas em runtime
- ✅ Executável assinado digitalmente (opcional)
- ✅ Sandbox do WebView2

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

## 👨‍💻 Autor

**Rian**
- GitHub: [@rianrp](https://github.com/rianrp)

## 🙏 Agradecimentos

- [Tauri](https://tauri.app/) - Framework desktop incrível
- [React](https://react.dev/) - Biblioteca UI moderna
- [Rust](https://www.rust-lang.org/) - Performance e segurança

## 📮 Suporte

Encontrou um bug ou tem uma sugestão?
- Abra uma [Issue](https://github.com/rianrp/InspiraView_DearPyGui_v1/issues)

---

⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!
