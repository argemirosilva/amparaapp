# Plugins Nativos iOS - Ampara

Plugins customizados para funcionalidades nativas do iOS que não existem no Capacitor padrão.

## 📦 Plugins Implementados

### 1. **SecureStoragePlugin.swift**
- **Nome JS:** `SecureStorage`
- **Função:** Armazena dados sensíveis (token, refreshToken) no Keychain do iOS
- **Métodos:**
  - `set(key, value)` - Salva valor no Keychain
  - `get(key)` - Busca valor do Keychain
  - `remove(key)` - Remove valor do Keychain
  - `clear()` - Limpa todos os valores
- **Equivalente Android:** SharedPreferences com `ampara_secure_storage`

### 2. **PermissionsPlugin.swift**
- **Nome JS:** `Permissions`, `AudioPermission`, `BatteryOptimization`
- **Função:** Gerencia permissões de microfone, localização, notificações
- **Métodos:**
  - `checkMicrophone()` - Verifica permissão de microfone
  - `requestMicrophone()` - Solicita permissão de microfone
  - `checkBatteryOptimization()` - Sempre retorna OK (iOS não tem)
  - `checkAlarmPermission()` - Sempre retorna OK (iOS não precisa)
- **Equivalente Android:** AudioPermissionPlugin, BatteryOptimizationPlugin

### 3. **SessionExpiredListenerPlugin.swift**
- **Nome JS:** `SessionExpiredListener`
- **Função:** Escuta notificações nativas de sessão expirada (HTTP 401)
- **Eventos:**
  - `sessionExpired` - Disparado quando token expira
- **Equivalente Android:** BroadcastReceiver com `SESSION_EXPIRED`

### 4. **KeepAlivePlugin.swift**
- **Nome JS:** `KeepAlive`
- **Função:** Gerencia pings periódicos ao backend (35s)
- **Métodos:**
  - `start(deviceId)` - Inicia timer de ping
  - `stop()` - Para timer de ping
- **Features:**
  - Renovação automática de token em caso de 401
  - Coleta de device info (timezone, bateria, modelo)
  - Envia pings mesmo em background (com limitações do iOS)
- **Equivalente Android:** KeepAliveService (Foreground Service)

### 5. **DeviceInfoExtendedPlugin.swift**
- **Nome JS:** `DeviceInfoExtended`
- **Função:** Coleta informações estendidas do dispositivo
- **Métodos:**
  - `getExtendedInfo()` - Retorna objeto com:
    - `deviceModel` - Modelo do iPhone
    - `batteryLevel` - Nível de bateria (0-100)
    - `isCharging` - Se está carregando
    - `iosVersion` - Versão do iOS
    - `appVersion` - Versão do app
    - `connectionType` - wifi/cellular/none
- **Equivalente Android:** DeviceInfoExtendedPlugin

## 🔧 Como Registrar no Xcode

Os plugins Swift precisam ser registrados manualmente no Xcode:

1. **Abrir projeto:**
   ```bash
   npx cap open ios
   ```

2. **No Xcode:**
   - Clique em `App` (ícone azul) no painel esquerdo
   - Vá em `Build Phases` → `Compile Sources`
   - Clique no `+` e adicione todos os arquivos `.swift` da pasta `Plugins/`

3. **Ou adicionar via Finder:**
   - Arraste a pasta `Plugins/` para dentro do projeto no Xcode
   - Marque "Copy items if needed"
   - Marque "Create groups"
   - Target: `App`

## 📱 Configurações Necessárias

### Info.plist

Adicionar permissões e background modes:

```xml
<!-- Permissões -->
<key>NSMicrophoneUsageDescription</key>
<string>O Ampara precisa acessar o microfone para detectar situações de risco</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>O Ampara precisa da sua localização para enviar alertas precisos</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>O Ampara precisa da sua localização em background para proteção contínua</string>

<!-- Background Modes -->
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
    <string>location</string>
    <string>audio</string>
</array>
```

### Capabilities (Xcode)

1. **Background Modes:**
   - ✅ Background fetch
   - ✅ Background processing
   - ✅ Location updates
   - ✅ Audio, AirPlay, and Picture in Picture

2. **Push Notifications:**
   - ✅ Habilitado

## 🔄 Diferenças iOS vs Android

| Feature | Android | iOS |
|---------|---------|-----|
| **Storage Seguro** | SharedPreferences | Keychain |
| **Serviço Background** | Foreground Service | Background Fetch + Timer |
| **Ping Interval** | 30-45s | 35s (limitado pelo iOS) |
| **Battery Optimization** | Precisa whitelist | Não existe |
| **Alarm Permission** | Precisa permissão (API 31+) | Não precisa |
| **Notificações** | BroadcastReceiver | NotificationCenter |
| **Token Refresh** | HTTP com timeout 60s | URLSession com timeout 60s |

## ⚠️ Limitações do iOS

1. **Background Execution:**
   - iOS suspende apps em background após ~3 minutos
   - Timer de ping pode parar se app ficar muito tempo em background
   - Solução: Usar Background Fetch ou Location Updates

2. **Ping Frequency:**
   - iOS limita frequência de background tasks
   - Pings podem não ser tão frequentes quanto no Android

3. **Battery Monitoring:**
   - Força do sinal WiFi não é acessível sem APIs privadas
   - Algumas informações de rede são restritas

## 🚀 Próximos Passos

1. **AudioTriggerPlugin:** Monitoramento contínuo de áudio em background
2. **PanicPlugin:** Ativação de pânico com volume/power button
3. **IconChangerPlugin:** Troca de ícone do app
4. **AlarmPermissionPlugin:** Agendamento de tarefas

## 📝 Notas

- Todos os plugins seguem o padrão `CAPBridgedPlugin` do Capacitor 6+
- Código compatível com iOS 13+
- Logs usam `CAPLog.print()` para aparecer no console do Xcode
- Métodos estáticos permitem acesso nativo entre plugins
