import Foundation
import Capacitor
import UIKit

/**
 * KeepAlivePlugin para iOS
 * Gerencia background tasks e pings periódicos ao backend
 * Usa Background Fetch e Background Processing do iOS
 */
@objc(KeepAlivePlugin)
public class KeepAlivePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KeepAlivePlugin"
    public let jsName = "KeepAlive"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]
    
    private var pingTimer: DispatchSourceTimer?
    private let pingInterval: TimeInterval = 35.0 // 35 segundos (entre 30-45s do Android)
    
    @objc func start(_ call: CAPPluginCall) {
        // Salvar device_id no UserDefaults (equivalente ao SharedPreferences)
        if let deviceId = call.getString("deviceId") {
            UserDefaults.standard.set(deviceId, forKey: "ampara_device_id")
            CAPLog.print("✅ Device ID synchronized: \(deviceId)")
        } else {
            CAPLog.print("⚠️ No device_id provided, using fallback")
        }
        
        // Iniciar timer de ping em background
        startPingTimer()
        
        // Registrar background tasks
        registerBackgroundTasks()
        
        CAPLog.print("✅ KeepAlive service started")
        call.resolve()
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        stopPingTimer()
        CAPLog.print("KeepAlive service stopped")
        call.resolve()
    }
    
    // MARK: - Ping Timer
    
    private func startPingTimer() {
        stopPingTimer()
        
        // Enviar primeiro ping imediatamente
        sendPing()
        
        // Use DispatchSourceTimer instead of Timer.scheduledTimer
        // DispatchSourceTimer works in background because it runs on a DispatchQueue,
        // not on the RunLoop (which is suspended in background)
        let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .utility))
        timer.schedule(deadline: .now() + pingInterval, repeating: pingInterval)
        timer.setEventHandler { [weak self] in
            self?.sendPing()
        }
        timer.resume()
        pingTimer = timer
        
        CAPLog.print("🏓 Ping timer started with DispatchSourceTimer (interval: \(pingInterval)s) - works in background")
    }
    
    private func stopPingTimer() {
        pingTimer?.cancel()
        pingTimer = nil
    }
    
    private func sendPing() {
        // Executar em background thread
        DispatchQueue.global(qos: .background).async { [weak self] in
            self?.performPing()
        }
    }
    
    private func performPing() {
        // Buscar token do Keychain
        guard let token = SecureStoragePlugin.getValueForKey("ampara_session_token") else {
            CAPLog.print("⚠️ No token found in SecureStorage, skipping native ping")
            return
        }
        
        // Buscar device_id
        let deviceId = UserDefaults.standard.string(forKey: "ampara_device_id") ?? "ios-unknown"
        
        // Coletar device info
        let deviceInfo = collectDeviceInfo()
        
        // Preparar payload
        var payload: [String: Any] = [
            "device_id": deviceId,
            "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown",
            "os_version": UIDevice.current.systemVersion,
            "battery_level": UIDevice.current.batteryLevel * 100,
            "is_charging": UIDevice.current.batteryState == .charging || UIDevice.current.batteryState == .full
        ]
        
        // Adicionar device info
        payload.merge(deviceInfo) { (_, new) in new }
        
        // Enviar ping
        sendPingToBackend(token: token, payload: payload)
    }
    
    private func collectDeviceInfo() -> [String: Any] {
        var info: [String: Any] = [:]
        
        // Timezone
        let timezone = TimeZone.current.identifier
        let offsetMinutes = TimeZone.current.secondsFromGMT() / 60
        info["timezone"] = timezone
        info["timezone_offset_minutes"] = offsetMinutes
        
        // Device info
        info["model"] = UIDevice.current.model
        info["device_name"] = UIDevice.current.name
        
        return info
    }
    
    private func sendPingToBackend(token: String, payload: [String: Any]) {
        // URL do backend (usar mesma do Android)
        guard let url = URL(string: "https://ilikiajeduezvvanjejz.supabase.co/functions/v1/mobile-api") else {
            CAPLog.print("❌ Invalid ping URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            CAPLog.print("❌ Failed to serialize ping payload: \(error)")
            return
        }
        
        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                CAPLog.print("❌ Ping failed: \(error.localizedDescription)")
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                CAPLog.print("❌ Invalid ping response")
                return
            }
            
            if httpResponse.statusCode == 401 {
                CAPLog.print("🔴 Ping returned 401 - Session expired, notifying JS")
                self?.handleSessionExpired()
            } else if httpResponse.statusCode == 200 {
                CAPLog.print("✅ Ping successful")
            } else {
                CAPLog.print("⚠️ Ping returned status: \(httpResponse.statusCode)")
            }
        }
        
        task.resume()
    }
    
    private func handleSessionExpired() {
        // Notificar o SessionExpiredListenerPlugin
        SessionExpiredListenerPlugin.notifySessionExpired(source: "KeepAliveService")
        
        // Tentar renovar token nativamente
        attemptTokenRefresh()
    }
    
    private func attemptTokenRefresh() {
        guard let refreshToken = SecureStoragePlugin.getValueForKey("ampara_refresh_token") else {
            CAPLog.print("❌ No refresh token available")
            return
        }
        
        let deviceId = UserDefaults.standard.string(forKey: "ampara_device_id") ?? "ios-unknown"
        
        guard let url = URL(string: "https://ilikiajeduezvvanjejz.supabase.co/functions/v1/mobile-api") else {
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60
        
        let payload: [String: Any] = [
            "refresh_token": refreshToken,
            "device_id": deviceId
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            CAPLog.print("❌ Failed to serialize refresh payload: \(error)")
            return
        }
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                CAPLog.print("❌ Token refresh failed: \(error.localizedDescription)")
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200,
                  let data = data else {
                CAPLog.print("❌ Invalid refresh response")
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let newToken = json["session_token"] as? String {
                    
                    // Salvar novo token
                    _ = SecureStoragePlugin.setValueForKey("ampara_session_token", value: newToken)
                    CAPLog.print("✅ Token refreshed successfully in native")
                    
                    // Salvar novo refresh token se vier
                    if let newRefreshToken = json["refresh_token"] as? String {
                        _ = SecureStoragePlugin.setValueForKey("ampara_refresh_token", value: newRefreshToken)
                    }
                }
            } catch {
                CAPLog.print("❌ Failed to parse refresh response: \(error)")
            }
        }
        
        task.resume()
    }
    
    // MARK: - Background Tasks
    
    private func registerBackgroundTasks() {
        // iOS usa Background Fetch configurado no Info.plist
        // UIBackgroundModes: ["fetch", "processing", "location"]
        CAPLog.print("Background tasks registration (configured in Info.plist)")
    }
}
