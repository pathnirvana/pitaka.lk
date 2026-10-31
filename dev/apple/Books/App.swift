// The books and dhammapada sites of pitaka.lk offline (the iOS app "Sinhala Buddhist Books"). The pages are in the
// bundle at the same paths as on the web (site/books/, site/dhammapada/, site/tools/unicode/fonts/web/,
// site/static/singlish-search/; dev/apple/build-ios.sh) and served at app://pitaka.lk/, a real origin, so the pages
// work as on the web: search (fetch), the absolute /tools and /static paths, localStorage (bookmarks, continue reading,
// settings). Links to other sites open in Safari. The status bar takes the colour of the top bar (reader.js).
import AVFoundation
import UIKit
import WebKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        UISceneConfiguration(name: "Default", sessionRole: session.role)
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: scene)
        window.rootViewController = WebViewController()
        window.makeKeyAndVisible()
        self.window = window
    }
}

let home = URL(string: "app://pitaka.lk/books/index.html")!

final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    private var webView: WKWebView!
    private let topBar = UIView() // behind the status bar: the colour of the top bar of the page
    private var lightContent = false

    override func loadView() {
        let site = Bundle.main.resourceURL!.appendingPathComponent("site")
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = [] // the next gatha recitation plays when one ends
        config.allowsInlineMediaPlayback = true
        config.setURLSchemeHandler(BundleSchemeHandler(root: site), forURLScheme: "app")
        config.userContentController.add(WeakHandler(self), name: "statusBar")
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never // the web view is inside the safe area
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif

        let view = UIView()
        let paper = UIColor(red: 0.992, green: 0.984, blue: 0.969, alpha: 1) // --bg of the light theme until the page reports
        view.backgroundColor = paper
        webView.isOpaque = false
        webView.backgroundColor = paper
        topBar.backgroundColor = UIColor(red: 0.965, green: 0.941, blue: 0.902, alpha: 1) // --surface
        for v in [topBar, webView!] { v.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(v) }
        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            topBar.topAnchor.constraint(equalTo: view.topAnchor), topBar.bottomAnchor.constraint(equalTo: safe.topAnchor),
            topBar.leadingAnchor.constraint(equalTo: view.leadingAnchor), topBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: safe.topAnchor), webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: safe.leadingAnchor), webView.trailingAnchor.constraint(equalTo: safe.trailingAnchor),
        ])
        self.view = view

        var start = home
        #if DEBUG // screenshots and tests: simctl launch … -start books/kunala-jathaka/1.html
        if let path = UserDefaults.standard.string(forKey: "start"), let url = URL(string: path, relativeTo: URL(string: "app://pitaka.lk/")) { start = url.absoluteURL }
        #endif
        OldStorage.migrate(into: webView) { [weak self] in self?.webView.load(URLRequest(url: start)) }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { lightContent ? .lightContent : .darkContent }

    // reader.js: window.webkit.messageHandlers.statusBar.postMessage('#f6f0e6') when the theme changes
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let hex = message.body as? String, let color = UIColor(hex: hex) else { return }
        topBar.backgroundColor = color
        var white: CGFloat = 0
        color.getWhite(&white, alpha: nil)
        lightContent = white < 0.5
        setNeedsStatusBarAppearanceUpdate()
    }

    // links to other sites open in Safari (or the App Store, Facebook…)
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url, !["app", "about", "file"].contains(url.scheme ?? "") else { return decisionHandler(.allow) }
        if ["http", "https", "mailto", "itms-apps"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url, ["http", "https", "mailto"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
        return nil
    }

    // the web content process can be ended by the system (memory): reload instead of a blank page
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }
}

/// the apps before 3.0 showed the pages from file URLs, so their bookmarks and settings are in the localStorage of
/// file://, which app://pitaka.lk can not see: read once from a file page and given to reader.js as
/// window.pitakaOldStorage, which adds the ones the new pages do not have
enum OldStorage {
    static let key = "storage-migrated"
    private static var reader: Reader? // alive while it reads

    static func migrate(into webView: WKWebView, then: @escaping () -> Void) {
        guard !UserDefaults.standard.bool(forKey: key) else { return then() }
        let page = FileManager.default.temporaryDirectory.appendingPathComponent("migrate.html")
        try? "<script>var o={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);o[k]=localStorage.getItem(k)}}catch(e){}window.webkit.messageHandlers.oldStorage.postMessage(JSON.stringify(o))</script>"
            .write(to: page, atomically: true, encoding: .utf8)
        let r = Reader(webView: webView, then: then)
        reader = r
        let config = WKWebViewConfiguration() // the default data store, as the old app's
        config.userContentController.add(r, name: "oldStorage")
        r.hidden = WKWebView(frame: .zero, configuration: config)
        r.hidden?.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { r.finish("{}") } // never wait longer
    }

    final class Reader: NSObject, WKScriptMessageHandler {
        weak var webView: WKWebView?
        var hidden: WKWebView?
        var then: (() -> Void)?
        init(webView: WKWebView, then: @escaping () -> Void) { self.webView = webView; self.then = then }

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            finish(message.body as? String ?? "{}")
        }

        func finish(_ json: String) {
            guard let then else { return }
            self.then = nil
            hidden?.configuration.userContentController.removeScriptMessageHandler(forName: "oldStorage")
            hidden = nil
            OldStorage.reader = nil
            UserDefaults.standard.set(true, forKey: OldStorage.key)
            if json != "{}", let webView { // given to the first page only (reader.js adds what is missing)
                webView.configuration.userContentController.addUserScript(WKUserScript(
                    source: "if(location.protocol=='app:'&&!sessionStorage.oldStorageGiven){sessionStorage.oldStorageGiven=1;window.pitakaOldStorage=\(jsString(json))}",
                    injectionTime: .atDocumentStart, forMainFrameOnly: true))
            }
            then()
        }
    }
}

/// the message handler is kept by the configuration: not the view controller itself
final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) { target?.userContentController(c, didReceive: m) }
}

/// serves the bundled sites at app://pitaka.lk/…, with byte ranges for the recordings (seeking)
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL
    init(root: URL) { self.root = root.standardizedFileURL }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = String(url.path.dropFirst())
        if path.isEmpty || path.hasSuffix("/") { path += "index.html" }
        let file = root.appendingPathComponent(path).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"), let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            task.didReceive(HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!)
            task.didFinish()
            return
        }
        var headers = ["Content-Type": mimeType(file.pathExtension), "Accept-Ranges": "bytes", "Cache-Control": "no-cache"]
        var status = 200, body = data
        if let range = task.request.value(forHTTPHeaderField: "Range"), let (from, to) = byteRange(range, size: data.count) {
            status = 206
            body = data.subdata(in: from..<(to + 1))
            headers["Content-Range"] = "bytes \(from)-\(to)/\(data.count)"
        }
        headers["Content-Length"] = String(body.count)
        task.didReceive(HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!)
        task.didReceive(body)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    /// "bytes=100-" / "bytes=100-200" / "bytes=-500"
    private func byteRange(_ header: String, size: Int) -> (Int, Int)? {
        guard size > 0, header.hasPrefix("bytes=") else { return nil }
        let parts = header.dropFirst(6).split(separator: "-", omittingEmptySubsequences: false).map { Int($0.trimmingCharacters(in: .whitespaces)) }
        guard parts.count == 2 else { return nil }
        switch (parts[0], parts[1]) {
        case let (from?, to?): return from <= to && from < size ? (from, min(to, size - 1)) : nil
        case let (from?, nil): return from < size ? (from, size - 1) : nil
        case let (nil, last?): return last > 0 ? (max(0, size - last), size - 1) : nil
        default: return nil
        }
    }

    private func mimeType(_ ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "txt": return "text/plain; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "mp3": return "audio/mpeg"
        case "woff2": return "font/woff2"
        case "wasm": return "application/wasm"
        default: return "application/octet-stream" // pagefind's index files
        }
    }
}

extension UIColor {
    /// "#f6f0e6"
    convenience init?(hex: String) {
        let s = hex.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "#", with: "")
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(red: CGFloat((v >> 16) & 0xff) / 255, green: CGFloat((v >> 8) & 0xff) / 255, blue: CGFloat(v & 0xff) / 255, alpha: 1)
    }
}

/// a JavaScript string literal
func jsString(_ s: String) -> String {
    guard let data = try? JSONEncoder().encode(s), let literal = String(data: data, encoding: .utf8) else { return "\"\"" }
    return literal
}
