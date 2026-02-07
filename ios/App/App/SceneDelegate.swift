import UIKit
import Capacitor
import WebKit
import AVFoundation

class SceneDelegate: UIResponder, UIWindowSceneDelegate, WKNavigationDelegate {
    
    private final class LoadingViewController: UIViewController {
        private let spinner = UIActivityIndicatorView(style: .large)
        override func viewDidLoad() {
            super.viewDidLoad()
            view.backgroundColor = UIColor.systemBackground
            spinner.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(spinner)
            NSLayoutConstraint.activate([
                spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
                spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor)
            ])
            spinner.startAnimating()
        }
    }

    var window: UIWindow?
    var bridgeViewController: CAPBridgeViewController?
    private var loadingTimeoutTimer: Timer?
    private var progressCheckTimer: Timer?

    private func logBundlePublicContents() {
        if let publicURL = Bundle.main.url(forResource: "public", withExtension: nil) {
            print("[SceneDelegate] 📦 Bundle public URL:", publicURL.path)
            do {
                let items = try FileManager.default.contentsOfDirectory(atPath: publicURL.path)
                print("[SceneDelegate] 📦 public/ contents (\(items.count) items):\n\(items.joined(separator: "\n"))")
            } catch {
                print("[SceneDelegate] ⚠️ Failed to list public/:", error.localizedDescription)
            }
        } else {
            print("[SceneDelegate] ⚠️ Could not find public/ in bundle")
        }
        if let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "public") {
            print("[SceneDelegate] 🔎 index.html found at:", indexURL.path)
        } else {
            print("[SceneDelegate] ❌ index.html NOT found under public/")
        }
    }

    private func logWebViewState(_ webView: WKWebView?, context: String) {
        guard let webView = webView else {
            print("[SceneDelegate] (\(context)) webView is nil")
            return
        }
        print("[SceneDelegate] (\(context)) webView.url=\(webView.url?.absoluteString ?? "<nil>") isLoading=\(webView.isLoading) estimatedProgress=\(webView.estimatedProgress)")
    }

    private func presentLoadErrorAlert(on window: UIWindow, error: Error?, retry: @escaping () -> Void) {
        let message = (error as NSError?)?.localizedDescription ?? "Falha ao carregar o conteúdo."
        let alert = UIAlertController(title: "Erro ao carregar", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Tentar novamente", style: .default, handler: { _ in retry() }))
        alert.addAction(UIAlertAction(title: "Fechar", style: .cancel, handler: nil))
        (window.rootViewController ?? self.window?.rootViewController)?.present(alert, animated: true)
    }

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {

        guard let windowScene = scene as? UIWindowScene else { return }

        // 1) Exibe placeholder imediatamente
        let window = UIWindow(windowScene: windowScene)
        let loadingVC = LoadingViewController()
        window.rootViewController = loadingVC
        self.window = window
        window.makeKeyAndVisible()

        print("[SceneDelegate] 🚀 Scene willConnectTo - showing placeholder")
        logBundlePublicContents()

        // 2) Prepara o BridgeViewController em paralelo
        let bridgeVC = CAPBridgeViewController()
        // Ajuste imediato de safe area para evitar conteúdo sob a barra de status/notch
        bridgeVC.additionalSafeAreaInsets = UIEdgeInsets(top: 80, left: 0, bottom: 0, right: 0)
        self.bridgeViewController = bridgeVC

        if let webView = bridgeVC.bridge?.webView as? WKWebView {
            logWebViewState(webView, context: "after bridgeVC creation")
        } else {
            print("[SceneDelegate] ℹ️ bridgeVC.webView not available yet")
        }

        if let webView = bridgeVC.bridge?.webView as? WKWebView {
            webView.navigationDelegate = self
        }

        // 3) Aguarda a webView carregar antes de trocar do placeholder
        func switchToBridge() {
            // Invalidate all timers
            self.loadingTimeoutTimer?.invalidate()
            self.loadingTimeoutTimer = nil
            self.progressCheckTimer?.invalidate()
            self.progressCheckTimer = nil
            
            print("[SceneDelegate] 🔄 Switching to bridge rootViewController")
            UIView.transition(with: window, duration: 0.25, options: .transitionCrossDissolve, animations: {
                window.rootViewController = bridgeVC
            }, completion: { _ in
                print("[SceneDelegate] ✅ Switched to bridge rootViewController")
                self.registerPluginsWithRetry()
            })
        }

        // Timeout de segurança (5s): se não carregar até lá, troca mesmo assim
        self.loadingTimeoutTimer?.invalidate()
        self.loadingTimeoutTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            print("[SceneDelegate] ⏰ Loading timeout reached - forcing switch")
            switchToBridge()
        }

        // Usa timer polling em vez de KVO (evita crash de removeObserver)
        if let webView = bridgeVC.bridge?.webView as? WKWebView {
            if webView.estimatedProgress >= 0.8 || webView.isLoading == false {
                print("[SceneDelegate] ✅ WebView já carregada o suficiente, trocando para bridge")
                switchToBridge()
            } else {
                print("[SceneDelegate] ⏳ Aguardando WebView carregar (polling)...")
                self.progressCheckTimer = Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { [weak self] timer in
                    guard let self = self else { timer.invalidate(); return }
                    guard let wv = self.bridgeViewController?.bridge?.webView as? WKWebView else { return }
                    if wv.estimatedProgress >= 0.8 {
                        print("[SceneDelegate] ✅ WebView atingiu progresso suficiente via polling")
                        switchToBridge()
                    }
                }
            }
        } else {
            // Fallback: se não conseguir acessar a webView, usa pequeno atraso
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                guard let self = self else { return }
                print("[SceneDelegate] ℹ️ WebView não disponível ainda, trocando para bridge por fallback")
                switchToBridge()
            }
        }
    }

    private func registerPluginsWithRetry(retryCount: Int = 5, delay: TimeInterval = 0.4) {
        print("[SceneDelegate] 🔧 registerPluginsWithRetry called")
        guard let bridge = bridgeViewController?.bridge as? CapacitorBridge else {
            print("[SceneDelegate] ⏳ Bridge not ready, will retry (remaining: \(retryCount))")
            if retryCount > 0 {
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                    self?.registerPluginsWithRetry(retryCount: retryCount - 1, delay: delay)
                }
            }
            return
        }
        print("[SceneDelegate] 🔌 Registering plugins with Capacitor bridge")
        PluginRegistration.registerPlugins(with: bridge)
        print("[SceneDelegate] ✅ Plugins registered")
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        // Cleanup timers
        loadingTimeoutTimer?.invalidate()
        loadingTimeoutTimer = nil
        progressCheckTimer?.invalidate()
        progressCheckTimer = nil
        
        // Release AVAudioSession to prevent microphone lock on next launch
        print("[SceneDelegate] 🚨 Scene disconnecting - releasing audio session")
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            print("[SceneDelegate] ✅ Audio session deactivated on disconnect")
        } catch {
            print("[SceneDelegate] ⚠️ Could not deactivate audio session: \(error.localizedDescription)")
        }
    }

    func sceneDidBecomeActive(_ scene: UIScene) { }

    func sceneWillResignActive(_ scene: UIScene) { }

    func sceneWillEnterForeground(_ scene: UIScene) { }

    func sceneDidEnterBackground(_ scene: UIScene) { }

    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        logWebViewState(webView, context: "didStart")
        print("[SceneDelegate] 🌐 didStartProvisionalNavigation: \(webView.url?.absoluteString ?? "<nil>")")
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        logWebViewState(webView, context: "didFinish")
        print("[SceneDelegate] ✅ didFinish: \(webView.url?.absoluteString ?? "<nil>")")
        // Quando terminar, se ainda não trocamos, garanta a troca para o bridge
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let window = self.window, let bridgeVC = self.bridgeViewController else { return }
            if window.rootViewController !== bridgeVC {
                print("[SceneDelegate] 🔄 Switching to bridge rootViewController")
                // Cleanup timers
                self.loadingTimeoutTimer?.invalidate()
                self.loadingTimeoutTimer = nil
                self.progressCheckTimer?.invalidate()
                self.progressCheckTimer = nil
                
                UIView.transition(with: window, duration: 0.25, options: .transitionCrossDissolve, animations: {
                    window.rootViewController = bridgeVC
                }, completion: { _ in
                    print("[SceneDelegate] ✅ Switched to bridge rootViewController")
                    self.registerPluginsWithRetry()
                })
            }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        logWebViewState(webView, context: "didFailProvisional")
        print("[SceneDelegate] ❌ didFailProvisionalNavigation: \(error.localizedDescription)")
        guard let window = self.window else { return }
        presentLoadErrorAlert(on: window, error: error) { [weak self] in
            guard let self = self else { return }
            webView.reload()
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        logWebViewState(webView, context: "didFail")
        print("[SceneDelegate] ❌ didFail: \(error.localizedDescription)")
        guard let window = self.window else { return }
        presentLoadErrorAlert(on: window, error: error) { [weak self] in
            guard let self = self else { return }
            webView.reload()
        }
    }
}
