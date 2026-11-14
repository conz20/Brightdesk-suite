import Foundation
import Network
import Darwin

/// Uses Apple's Network framework to discover local IPP/IPPS Bonjour services.
///
/// This helper only browses services advertised on the local network and
/// resolves their advertised endpoints. It never adds a queue, installs a
/// driver, sends print data, or scans arbitrary address ranges.
final class IPPServiceDiscovery {
    private let timeout: TimeInterval
    private let queue = DispatchQueue(label: "com.brightdesk.printing.bonjour")
    private var browsers: [NWBrowser] = []
    private var connections: [NWConnection] = []
    private var requestedEndpoints = Set<NWEndpoint>()
    private var results = Set<String>()
    private var searchErrors: [String] = []

    init(timeout: TimeInterval) {
        self.timeout = timeout
    }

    func run() {
        for serviceType in ["_ipp._tcp", "_ipps._tcp", "_printer._tcp"] {
            let browser = NWBrowser(
                for: .bonjourWithTXTRecord(type: serviceType, domain: "local."),
                using: .tcp
            )
            browser.stateUpdateHandler = { [weak self] state in
                guard let self else { return }
                switch state {
                case .ready:
                    self.searchErrors.removeAll { $0.hasPrefix("\(serviceType) ") }
                case .waiting(let error):
                    let message: String
                    if case .dns(let code) = error, Int(code) == -65570 {
                        message = "LOCAL_NETWORK_ACCESS_DENIED: Allow Brightdesk to discover devices on your local network in System Settings > Privacy & Security > Local Network."
                    } else {
                        message = "\(serviceType) is waiting for network access: \(error)"
                    }
                    if !self.searchErrors.contains(message) {
                        self.searchErrors.append(message)
                    }
                case .failed(let error):
                    self.searchErrors.append("\(serviceType) failed: \(error)")
                default:
                    break
                }
            }
            browser.browseResultsChangedHandler = { [weak self] discovered, _ in
                for result in discovered {
                    self?.resolve(result, serviceType: serviceType)
                }
            }
            browsers.append(browser)
            browser.start(queue: queue)
        }

        Thread.sleep(forTimeInterval: timeout)

        let snapshot = queue.sync {
            browsers.forEach { $0.cancel() }
            connections.forEach { $0.cancel() }
            return (uris: results.sorted(), errors: searchErrors)
        }

        if snapshot.uris.isEmpty && !snapshot.errors.isEmpty {
            let message = snapshot.errors.joined(separator: "; ")
            fputs("\(message)\n", stderr)
            exit(EXIT_FAILURE)
        }

        for uri in snapshot.uris {
            print(uri)
        }
    }

    private func resolve(_ result: NWBrowser.Result, serviceType: String) {
        guard requestedEndpoints.insert(result.endpoint).inserted else { return }
        guard case .bonjour(let txtRecord) = result.metadata else { return }
        let isLegacyLPD = serviceType.hasPrefix("_printer.")
        let resourcePath = txtRecord["rp"] ?? (isLegacyLPD ? "/" : "")
        guard !resourcePath.isEmpty else { return }

        let connection = NWConnection(to: result.endpoint, using: .tcp)
        connections.append(connection)
        connection.stateUpdateHandler = { [weak self, weak connection] state in
            guard let self, let connection else { return }
            switch state {
            case .ready:
                if
                    let remoteEndpoint = connection.currentPath?.remoteEndpoint,
                    case .hostPort(let host, let port) = remoteEndpoint
                {
                    self.recordURI(
                        host: Self.hostName(from: host),
                        port: port.rawValue,
                        resourcePath: resourcePath,
                        serviceType: serviceType
                    )
                }
                connection.cancel()
            case .failed(_), .cancelled:
                connection.cancel()
            default:
                break
            }
        }
        connection.start(queue: queue)
    }

    private func recordURI(host: String, port: UInt16, resourcePath: String, serviceType: String) {
        guard !host.isEmpty, port > 0 else { return }
        var components = URLComponents()
        components.scheme = serviceType.hasPrefix("_ipps.") ? "ipps" : (serviceType.hasPrefix("_printer.") ? "lpd" : "ipp")
        components.host = host
        components.port = Int(port)
        components.path = resourcePath.hasPrefix("/") ? resourcePath : "/" + resourcePath
        guard let uri = components.url?.absoluteString else { return }
        results.insert(uri)
    }

    private static func hostName(from host: NWEndpoint.Host) -> String {
        switch host {
        case .name(let name, _):
            return name.trimmingCharacters(in: CharacterSet(charactersIn: "."))
        case .ipv4(let address):
            return String(describing: address)
        case .ipv6(let address):
            return String(describing: address)
        @unknown default:
            return ""
        }
    }
}

if CommandLine.arguments.contains("--version") {
    print("brightdesk-ipp-discovery 0.1.0")
    exit(EXIT_SUCCESS)
}

let arguments = CommandLine.arguments
let timeoutIndex = arguments.firstIndex(of: "--timeout")
let requestedTimeout = timeoutIndex.flatMap { index in
    arguments.indices.contains(index + 1) ? Double(arguments[index + 1]) : nil
} ?? 10.0
let timeout = min(max(requestedTimeout, 1.0), 30.0)

IPPServiceDiscovery(timeout: timeout).run()
