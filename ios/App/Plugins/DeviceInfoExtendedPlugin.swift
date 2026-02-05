import Foundation
import Capacitor
import UIKit
import SystemConfiguration.CaptiveNetwork
import CoreTelephony

/**
 * DeviceInfoExtendedPlugin para iOS
 * Coleta informações estendidas do dispositivo (bateria, rede, modelo, etc)
 */
@objc(DeviceInfoExtendedPlugin)
public class DeviceInfoExtendedPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeviceInfoExtendedPlugin"
    public let jsName = "DeviceInfoExtended"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getExtendedInfo", returnType: CAPPluginReturnPromise)
    ]
    
    @objc func getExtendedInfo(_ call: CAPPluginCall) {
        // Habilitar monitoramento de bateria
        UIDevice.current.isBatteryMonitoringEnabled = true
        
        var result: [String: Any] = [:]
        
        // Device Model - Simplificado: "iPhone (iOS 18.7)"
        let deviceModel = "\(UIDevice.current.model) (iOS \(UIDevice.current.systemVersion))"
        result["deviceModel"] = deviceModel
        
        // Battery Level
        let batteryLevel = Int(UIDevice.current.batteryLevel * 100)
        result["batteryLevel"] = batteryLevel >= 0 ? batteryLevel : 0
        
        // Is Charging
        let batteryState = UIDevice.current.batteryState
        let isCharging = batteryState == .charging || batteryState == .full
        result["isCharging"] = isCharging
        
        // iOS Version
        result["iosVersion"] = UIDevice.current.systemVersion
        result["androidVersion"] = "N/A" // Android apenas
        
        // App Version
        let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        result["appVersion"] = appVersion
        
        // Battery Optimization (iOS não tem, sempre true)
        result["isIgnoringBatteryOptimization"] = true
        
        // Connection Type
        let connectionType = getConnectionType()
        result["connectionType"] = connectionType
        
        // WiFi Signal Strength (difícil de obter no iOS sem APIs privadas)
        result["wifiSignalStrength"] = NSNull()
        
        // Timezone
        let timezone = TimeZone.current.identifier
        result["timezone"] = timezone
        
        // Timezone Offset (em minutos)
        let timezoneOffsetMinutes = TimeZone.current.secondsFromGMT() / 60
        result["timezoneOffsetMinutes"] = timezoneOffsetMinutes
        
        CAPLog.print("Device info collected: \(result)")
        call.resolve(result)
    }

    
    private func getConnectionType() -> String {
        var zeroAddress = sockaddr_in()
        zeroAddress.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        zeroAddress.sin_family = sa_family_t(AF_INET)
        
        guard let defaultRouteReachability = withUnsafePointer(to: &zeroAddress, {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                SCNetworkReachabilityCreateWithAddress(nil, $0)
            }
        }) else {
            return "none"
        }
        
        var flags: SCNetworkReachabilityFlags = []
        if !SCNetworkReachabilityGetFlags(defaultRouteReachability, &flags) {
            return "none"
        }
        
        let isReachable = flags.contains(.reachable)
        let needsConnection = flags.contains(.connectionRequired)
        let isNetworkReachable = isReachable && !needsConnection
        
        if !isNetworkReachable {
            return "none"
        }
        
        // Verificar se é WiFi ou Cellular
        if flags.contains(.isWWAN) {
            return "cellular"
        } else {
            return "wifi"
        }
    }
}
