import Foundation
import Capacitor
import AVFoundation
import CoreLocation

/**
 * PermissionsPlugin para iOS
 * Gerencia permissões de microfone, localização, notificações
 * Equivalente aos plugins AudioPermission, BatteryOptimization do Android
 */
@objc(PermissionsPlugin)
public class PermissionsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PermissionsPlugin"
    public let jsName = "Permissions"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkMicrophone", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestMicrophone", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkBatteryOptimization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkAlarmPermission", returnType: CAPPluginReturnPromise)
    ]
    
    // MARK: - Microphone Permission
    
    @objc func checkMicrophone(_ call: CAPPluginCall) {
        let status = AVCaptureDevice.authorizationStatus(for: .audio)
        let granted = (status == .authorized)
        call.resolve(["granted": granted])
    }
    
    @objc func requestMicrophone(_ call: CAPPluginCall) {
        let status = AVCaptureDevice.authorizationStatus(for: .audio)
        
        switch status {
        case .authorized:
            call.resolve(["granted": true])
            
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                DispatchQueue.main.async {
                    call.resolve(["granted": granted])
                }
            }
            
        case .denied, .restricted:
            call.resolve(["granted": false])
            
        @unknown default:
            call.resolve(["granted": false])
        }
    }
    
    // MARK: - Battery Optimization (iOS não tem, sempre retorna OK)
    
    @objc func checkBatteryOptimization(_ call: CAPPluginCall) {
        // iOS não tem conceito de "battery optimization whitelist" como Android
        // Background modes são configurados no Info.plist
        // Sempre retorna true (otimizado) pois iOS gerencia automaticamente
        call.resolve([
            "isIgnoring": true,
            "canScheduleExactAlarms": true
        ])
    }
    
    // MARK: - Alarm Permission (iOS não precisa, sempre retorna OK)
    
    @objc func checkAlarmPermission(_ call: CAPPluginCall) {
        // iOS não precisa de permissão especial para alarmes/timers
        // Background fetch e notificações locais são suficientes
        call.resolve(["granted": true])
    }
}

/**
 * AudioPermissionPlugin - Alias para compatibilidade com código Android
 */
@objc(AudioPermissionPlugin)
public class AudioPermissionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioPermissionPlugin"
    public let jsName = "AudioPermission"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise)
    ]
    
    @objc func checkPermission(_ call: CAPPluginCall) {
        let status = AVCaptureDevice.authorizationStatus(for: .audio)
        let granted = (status == .authorized)
        call.resolve(["granted": granted])
    }
    
    @objc func requestPermission(_ call: CAPPluginCall) {
        let status = AVCaptureDevice.authorizationStatus(for: .audio)
        
        switch status {
        case .authorized:
            call.resolve(["granted": true])
            
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .audio) { granted in
                DispatchQueue.main.async {
                    call.resolve(["granted": granted])
                }
            }
            
        case .denied, .restricted:
            call.resolve(["granted": false])
            
        @unknown default:
            call.resolve(["granted": false])
        }
    }
}

/**
 * BatteryOptimizationPlugin - Alias para compatibilidade com código Android
 */
@objc(BatteryOptimizationPlugin)
public class BatteryOptimizationPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BatteryOptimizationPlugin"
    public let jsName = "BatteryOptimization"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isIgnoringBatteryOptimizations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestIgnoreBatteryOptimizations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestExactAlarmPermission", returnType: CAPPluginReturnPromise)
    ]
    
    @objc func isIgnoringBatteryOptimizations(_ call: CAPPluginCall) {
        // iOS não tem battery optimization whitelist
        call.resolve([
            "isIgnoring": true,
            "canScheduleExactAlarms": true
        ])
    }
    
    @objc func requestIgnoreBatteryOptimizations(_ call: CAPPluginCall) {
        // Não faz nada no iOS
        call.resolve()
    }
    
    @objc func requestExactAlarmPermission(_ call: CAPPluginCall) {
        // Não faz nada no iOS
        call.resolve()
    }
}
