# Instalação do SwiftLAME no iOS

## Sobre

**SwiftLAME** é um wrapper Swift para o encoder LAME (MP3). Converte áudio de M4A/WAV/AIFF para MP3.

- **Repositório:** https://github.com/hidden-spectrum/SwiftLAME
- **Licença:** LGPL 2.1 (mesma do LAME)
- **Plataformas:** iOS 15+, macOS 12+

## Instalação via Swift Package Manager

### 1. Abrir projeto no Xcode

```bash
cd /Users/argemironogueira/amparaapp
npx cap open ios
```

### 2. Adicionar Package Dependency

No Xcode:

1. Menu: **File → Add Package Dependencies...**

2. Colar URL no campo de busca:
   ```
   https://github.com/hidden-spectrum/SwiftLAME
   ```

3. **Dependency Rule:** Up to Next Major Version `0.1.0`

4. Clicar em **Add Package**

5. Selecionar **SwiftLAME** (marcar checkbox)

6. **Add to Target:** App

7. Clicar em **Add Package** novamente

### 3. Aguardar Download

O Xcode vai baixar SwiftLAME (inclui biblioteca LAME compilada).

### 4. Build

Pressionar **Cmd+B** para compilar.

### 5. Run

Pressionar **Cmd+R** para executar.

## Uso no Código

```swift
import SwiftLAME

// Configurar encoder
let config = SwiftLameEncoder.Configuration(
    sampleRate: .constant(44100),
    bitrateMode: .constant(128),
    quality: .mp3Standard
)

// Criar encoder
let encoder = try SwiftLameEncoder(
    sourceUrl: URL(fileURLWithPath: "/tmp/audio.m4a"),
    configuration: config,
    destinationUrl: URL(fileURLWithPath: "/tmp/audio.mp3")
)

// Converter
try await encoder.encode(priority: .userInitiated)
```

## Verificação

Após instalação, o arquivo `AudioSegmentUploader.swift` deve compilar sem erros:

```swift
import SwiftLAME  // ✅ Deve importar sem erro
```

## Troubleshooting

### Erro: "No such module 'SwiftLAME'"

**Solução:**
1. Verificar se o package foi adicionado em **Project Navigator → App → Package Dependencies**
2. Fazer **Clean Build Folder** (Shift+Cmd+K)
3. Fazer **Build** novamente (Cmd+B)

### Erro: "Failed to resolve dependencies"

**Solução:**
1. Verificar conexão com internet
2. Menu: **File → Packages → Reset Package Caches**
3. Menu: **File → Packages → Update to Latest Package Versions**

### Erro de compilação LAME

**Solução:**
- SwiftLAME inclui LAME pré-compilado
- Se houver erro, deletar `~/Library/Developer/Xcode/DerivedData` e fazer **Clean Build**

## Configurações de Qualidade

### Bitrate Modes:
- `.constant(128)` - 128 kbps (padrão, bom equilíbrio)
- `.constant(192)` - 192 kbps (alta qualidade)
- `.constant(320)` - 320 kbps (máxima qualidade)

### Quality Presets:
- `.mp3Best` - Melhor qualidade (mais lento)
- `.mp3Standard` - Qualidade padrão (balanceado)
- `.mp3Fast` - Conversão rápida (menor qualidade)

## Formato de Saída

- **Codec:** MPEG Audio Layer III (MP3)
- **Extensão:** `.mp3`
- **MIME Type:** `audio/mpeg`
- **Sample Rate:** 44.1 kHz
- **Bitrate:** 128 kbps (configurável)

## Compatibilidade

- **iOS:** 15.0+
- **Xcode:** 14.0+
- **Swift:** 5.5+ (async/await)
