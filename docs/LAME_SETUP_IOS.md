# Instalação do LAME MP3 Encoder no iOS

## Sobre

**LAME** (LAME Ain't an MP3 Encoder) é o encoder MP3 open-source mais popular. Usamos uma versão pré-compilada com wrappers Objective-C.

- **Fonte:** https://github.com/lixing123/ExtAudioFileConverter
- **Licença:** LGPL
- **Arquivos incluídos:**
  - `ExtAudioConverter.h` / `.m` - Wrapper Objective-C
  - `lame.h` - Header do LAME
  - `libmp3lame.a` - Biblioteca estática pré-compilada

## Arquivos Já Incluídos no Projeto

Os arquivos necessários já estão em `ios/App/LAME/`:

```
ios/App/LAME/
├── ExtAudioConverter.h
├── ExtAudioConverter.m
├── lame.h
└── libmp3lame.a
```

## Configuração no Xcode

### 1. Abrir projeto

```bash
cd /Users/argemironogueira/amparaapp
git pull origin main
npx cap open ios
```

### 2. Adicionar arquivos ao projeto (se necessário)

Se a pasta `LAME` não aparecer no **Project Navigator**:

1. Clicar com botão direito em **App** (pasta azul)
2. **Add Files to "App"...**
3. Navegar até `ios/App/LAME`
4. Selecionar a pasta `LAME`
5. Marcar **"Copy items if needed"**
6. Marcar **"Create groups"**
7. Target: **App**
8. Clicar **Add**

### 3. Configurar Bridging Header

O arquivo `App-Bridging-Header.h` já está criado. Verificar em **Build Settings**:

1. Selecionar target **App**
2. Aba **Build Settings**
3. Buscar: `Objective-C Bridging Header`
4. Valor deve ser: `App/App-Bridging-Header.h`

Se não estiver configurado:
1. Clicar duas vezes no campo
2. Digitar: `App/App-Bridging-Header.h`

### 4. Adicionar AudioToolbox Framework

1. Selecionar target **App**
2. Aba **General**
3. Seção **Frameworks, Libraries, and Embedded Content**
4. Clicar no **+**
5. Buscar: `AudioToolbox.framework`
6. Clicar **Add**

### 5. Configurar Library Search Path

1. Selecionar target **App**
2. Aba **Build Settings**
3. Buscar: `Library Search Paths`
4. Adicionar: `$(PROJECT_DIR)/App/LAME`

### 6. Build e Run

1. **Clean Build Folder** (Shift+Cmd+K)
2. **Build** (Cmd+B)
3. **Run** (Cmd+R)

## Uso no Código Swift

```swift
let converter = ExtAudioConverter()
converter.inputFile = "/path/to/input.m4a"
converter.outputFile = "/path/to/output.mp3"
converter.outputFileType = kAudioFileMP3Type
converter.outputFormatID = kAudioFormatMPEGLayer3

let success = converter.convert()
```

## Verificação

Após configuração, o código deve compilar sem erros:

```swift
// AudioSegmentUploader.swift
let converter = ExtAudioConverter()  // ✅ Deve funcionar
```

## Troubleshooting

### Erro: "Use of undeclared type 'ExtAudioConverter'"

**Solução:**
1. Verificar se `App-Bridging-Header.h` está configurado em **Build Settings**
2. Verificar se o caminho está correto: `App/App-Bridging-Header.h`
3. Fazer **Clean Build** (Shift+Cmd+K)

### Erro: "Library not found for -lmp3lame"

**Solução:**
1. Verificar **Library Search Paths** em **Build Settings**
2. Deve conter: `$(PROJECT_DIR)/App/LAME`
3. Verificar se `libmp3lame.a` está na pasta `ios/App/LAME/`

### Erro: "Framework not found AudioToolbox"

**Solução:**
1. Adicionar `AudioToolbox.framework` em **Frameworks, Libraries, and Embedded Content**
2. Menu: Target **App** → **General** → **+** → Buscar `AudioToolbox`

### Erro: "'lame.h' file not found"

**Solução:**
1. Verificar se pasta `LAME` foi adicionada ao projeto
2. Verificar se arquivos estão visíveis no **Project Navigator**
3. Se não, adicionar via **Add Files to "App"...**

## Formato de Saída

- **Codec:** MPEG Audio Layer III (MP3)
- **Extensão:** `.mp3`
- **MIME Type:** `audio/mpeg`
- **Sample Rate:** 44.1 kHz (padrão do input)
- **Bitrate:** Variável (baseado no input)
- **Channels:** Stereo (2 canais)

## Compatibilidade

- **iOS:** 8.0+
- **Xcode:** 14.0+
- **Swift:** 5.0+
- **Arquitetura:** arm64, x86_64 (simulador)

## Notas

- A biblioteca `libmp3lame.a` é uma biblioteca estática (fat binary) que contém código para múltiplas arquiteturas
- Não requer instalação via CocoaPods ou SPM
- Totalmente embarcada no projeto
- Sem dependências externas
