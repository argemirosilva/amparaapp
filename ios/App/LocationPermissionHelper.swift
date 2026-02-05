import Foundation
import CoreLocation

final class LocationPermissionHelper: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var onStatusChange: ((CLAuthorizationStatus) -> Void)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = kCLDistanceFilterNone
        if #available(iOS 11.0, *) {
            manager.showsBackgroundLocationIndicator = false
        }
    }

    func requestWhenInUseAuthorization(onStatusChange: @escaping (CLAuthorizationStatus) -> Void) {
        self.onStatusChange = onStatusChange
        manager.requestWhenInUseAuthorization()
    }

    func startUpdates() {
        manager.startUpdatingLocation()
    }

    func stopUpdates() {
        manager.stopUpdatingLocation()
    }

    func authorizationStatus() -> CLAuthorizationStatus {
        if #available(iOS 14.0, *) {
            return manager.authorizationStatus
        } else {
            return CLLocationManager.authorizationStatus()
        }
    }

    // MARK: - CLLocationManagerDelegate

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if #available(iOS 14.0, *) {
            onStatusChange?(manager.authorizationStatus)
        } else {
            onStatusChange?(CLLocationManager.authorizationStatus())
        }
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        onStatusChange?(status)
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        print("[Location] update: \(loc.coordinate.latitude), \(loc.coordinate.longitude)")
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("[Location] error: \(error)")
    }
}
