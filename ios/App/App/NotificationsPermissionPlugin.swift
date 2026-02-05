import Foundation
import Capacitor
import UserNotifications

@objc(NotificationsPermissionPlugin)
public class NotificationsPermissionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NotificationsPermissionPlugin"
    public let jsName = "NotificationsPermission"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    @objc func request(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                call.reject("Erro ao solicitar permissão de notificações: \(error.localizedDescription)")
                return
            }
            call.resolve([
                "granted": granted
            ])
        }
    }
    
    @objc func getStatus(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let status: String
            switch settings.authorizationStatus {
            case .notDetermined: status = "notDetermined"
            case .denied: status = "denied"
            case .authorized: status = "authorized"
            case .provisional: status = "provisional"
            case .ephemeral: status = "ephemeral"
            @unknown default: status = "unknown"
            }
            
            call.resolve([
                "status": status
            ])
        }
    }
    
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString),
                  UIApplication.shared.canOpenURL(url) else {
                call.reject("Não foi possível abrir Ajustes.")
                return
            }
            UIApplication.shared.open(url, options: [:]) { _ in
                call.resolve()
            }
        }
    }
}
