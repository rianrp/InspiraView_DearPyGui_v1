# InspiraView - Tauri Edition

Uma versão moderna do InspiraView construída com **Tauri**, oferecendo uma interface mais bonita e moderna para visualização de imagens com overlay.

## ✨ Funcionalidades

- 🖼️ **Carregamento de imagens** em vários formatos (PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF)
- 🔍 **Controle de zoom** de 10% a 500%
- 👁️ **Controle de opacidade** da janela (30% a 100%)
- 📌 **Sempre no topo** para uso como referência
- ⌨️ **Atalhos de teclado** para produtividade
- 🎨 **Interface moderna** com tema escuro
- 📱 **Responsiva** e intuitiva

## 🚀 Como executar

### Pré-requisitos

1. **Rust** - [Instalar Rust](https://rustup.rs/)
2. **Node.js** (opcional, apenas para desenvolvimento)

### Instalação

1. Abra o terminal no diretório do projeto
2. Execute o comando para desenvolvimento:

```powershell
# Se você tem Node.js
npm install
npm run tauri:dev

# Ou diretamente com Cargo
cd src-tauri
cargo tauri dev
```

### Build para produção

```powershell
# Com npm
npm run tauri:build

# Ou diretamente
cd src-tauri
cargo tauri build
```

## 🎮 Como usar

### Interface
- **Carregar Imagem**: Clique no botão ou use `Ctrl+O`
- **Zoom**: Use o slider ou teclas `+`/`-`
- **Reset Zoom**: Clique em "Reset" ou pressione `R`
- **Opacidade**: Ajuste com o slider
- **Fechar**: Pressione `Esc`

### Atalhos de teclado
- `Ctrl + O` - Abrir imagem
- `+` ou `=` - Aumentar zoom
- `-` - Diminuir zoom
- `R` - Resetar zoom (100%)
- `Esc` - Fechar aplicação

## 🛠️ Estrutura do projeto

```
InspiraView_DearPyGui_v1/
├── src/                    # Frontend (HTML, CSS, JS)
│   ├── index.html         # Interface principal
│   ├── styles.css         # Estilos modernos
│   └── script.js          # Lógica JavaScript
├── src-tauri/             # Backend Rust
│   ├── src/
│   │   └── main.rs        # Código Rust/Tauri
│   ├── Cargo.toml         # Dependências Rust
│   ├── tauri.conf.json    # Configurações Tauri
│   └── icons/             # Ícones da aplicação
├── package.json           # Dependências Node.js
└── README.md             # Esta documentação
```

## 🎨 Principais melhorias da versão Tauri

### Visual
- ✅ Interface moderna com gradientes e animações
- ✅ Tema escuro profissional
- ✅ Controles intuitivos e responsivos
- ✅ Feedback visual aprimorado
- ✅ Scrollbars customizadas

### Funcionalidade
- ✅ Suporte a mais formatos de imagem
- ✅ Zoom mais suave e preciso
- ✅ Atalhos de teclado intuitivos
- ✅ Notificações de erro elegantes
- ✅ Melhor gestão de recursos

### Performance
- ✅ Menor uso de memória
- ✅ Inicialização mais rápida
- ✅ Interface mais responsiva
- ✅ Bundle menor para distribuição

## 🐛 Solução de problemas

### Erro de compilação Rust
```bash
rustup update
cargo clean
cargo build
```

### Erro de dependências
```bash
npm install
cd src-tauri
cargo update
```

### Tauri não reconhecido
```bash
npm install -g @tauri-apps/cli
# ou
cargo install tauri-cli
```

## 📦 Distribuição

Após o build, o executável estará em:
- Windows: `src-tauri/target/release/bundle/msi/`
- Linux: `src-tauri/target/release/bundle/appimage/`
- macOS: `src-tauri/target/release/bundle/dmg/`

## 🤝 Contribuições

Sinta-se à vontade para contribuir com melhorias, reportar bugs ou sugerir novas funcionalidades!

## 📄 Licença

Este projeto é de código aberto. Use como preferir!

---

**Desenvolvido com ❤️ usando Tauri, HTML, CSS, JavaScript e Rust**
