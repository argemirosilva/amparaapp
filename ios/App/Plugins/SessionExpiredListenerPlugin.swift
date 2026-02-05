import Foundation
import Capacitor

/**
 * SessionExpiredListenerPlugin para iOS
 * Escuta notificações nativas de sessão expirada (HTTP 401)
 * Notifica o JavaScript para renovar o token
 * Equivalente ao BroadcastReceiver do Android
 */
@objc(SessionExpiredListenerPlugin)
public class SessionExpiredListenerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SessionExpiredListenerPlugin"
    public let jsName = "SessionExpiredListener"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    
    private static let sessionExpiredNotification = Notification.Name("tech.orizon.ampara.SESSION_EXPIRED")
    
    public override func load() {
        super.load()
        registerSessionExpiredObserver()
    }
    
    deinit {
        unregisterSessionExpiredObserver()
    }
    
    private func registerSessionExpiredObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSessionExpired(_:)),
            name: SessionExpiredListenerPlugin.sessionExpiredNotification,
            object: nil
        )
        CAPLog.print("✅ Session expired observer registered")
    }
    
    private func unregisterSessionExpiredObserver() {
        NotificationCenter.default.removeObserver(
            self,
            name: SessionExpiredListenerPlugin.sessionExpiredNotification,
            object: nil
        )
        CAPLog.print("Session expired observer unregistered")
    }
    
    @objc private func handleSessionExpired(_ notification: Notification) {
        let source = notification.userInfo?["source"] as? String ?? "unknown"
        CAPLog.print("📡 Session expired notification received from: \(source)")
        
        notifyListeners("sessionExpired", data: ["source": source])
    }
    
    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve(["value": value])
    }
    
    // MARK: - Public API for Native Services
    
    /**
     * Método estático para ser chamado por serviços nativos (KeepAlive, etc)
     * Envia notificação que será capturada pelo observer
     */
    public static func notifySessionExpired(source: String) {
        CAPLog.print("🔔 Posting session expired notification from: \(source)")
        NotificationCenter.default.post(
            name: sessionExpiredNotification,
            object: nil,
            userInfo: ["source": source]
        )
    }
}
