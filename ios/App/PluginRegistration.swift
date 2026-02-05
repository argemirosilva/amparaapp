import Foundation
import Capacitor

/**
 * PluginRegistration
 * Registra todos os plugins customizados do Ampara no Capacitor
 * 
 * IMPORTANTE: Este arquivo deve ser adicionado ao target App no Xcode
 */
@objc public class PluginRegistration: NSObject {
    // Flag para evitar registro duplicado
    private static var registered: Bool = false
    // Fila para garantir acesso thread-safe à flag de registro
    private static let registrationQueue = DispatchQueue(label: "com.ampara.pluginregistration.queue")

    // Logger padronizado com timestamp
    private static func log(_ message: String) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        let ts = formatter.string(from: Date())
        print("[\(ts)] [PluginRegistration] \(message)")
    }

    @objc public static func registerPlugins(with bridge: CapacitorBridge) {
        // Evitar registro duplicado de plugins
        let shouldProceed: Bool = registrationQueue.sync {
            if registered {
                return false
            } else {
                registered = true
                return true
            }
        }

        guard shouldProceed else {
            log("⚠️ Registro de plugins já foi executado anteriormente. Ignorando nova chamada.")
            return
        }

        log("================================================")
        log("INICIANDO REGISTRO DE PLUGINS")
        log("================================================")

        // Registrar plugins customizados com logs consistentes
        log("Registrando SecureStoragePlugin...")
        bridge.registerPluginInstance(SecureStoragePlugin())
        log("SecureStoragePlugin registrado!")

        log("Registrando PermissionsPlugin...")
        bridge.registerPluginInstance(PermissionsPlugin())
        log("PermissionsPlugin registrado!")

        log("Registrando AudioPermissionPlugin...")
        bridge.registerPluginInstance(AudioPermissionPlugin())
        log("AudioPermissionPlugin registrado!")

        log("Registrando BatteryOptimizationPlugin...")
        bridge.registerPluginInstance(BatteryOptimizationPlugin())
        log("BatteryOptimizationPlugin registrado!")

        log("Registrando SessionExpiredListenerPlugin...")
        bridge.registerPluginInstance(SessionExpiredListenerPlugin())
        log("SessionExpiredListenerPlugin registrado!")

        log("Registrando KeepAlivePlugin...")
        bridge.registerPluginInstance(KeepAlivePlugin())
        log("KeepAlivePlugin registrado!")

        log("Registrando DeviceInfoExtendedPlugin...")
        bridge.registerPluginInstance(DeviceInfoExtendedPlugin())
        log("DeviceInfoExtendedPlugin registrado!")

        log("Registrando AudioTriggerNativePlugin...")
        bridge.registerPluginInstance(AudioTriggerNativePlugin())
        log("AudioTriggerNativePlugin registrado!")
        
        log("Registrando NotificationsPermissionPlugin...")
        bridge.registerPluginInstance(NotificationsPermissionPlugin())
        log("NotificationsPermissionPlugin registrado!")

        log("================================================")
        log("✅ TODOS OS PLUGINS REGISTRADOS")
        log("================================================")
    }
}
