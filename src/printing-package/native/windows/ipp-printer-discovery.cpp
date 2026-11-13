#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <wingdi.h>
#include <winspool.h>
#include <windns.h>

#include <algorithm>
#include <array>
#include <cctype>
#include <chrono>
#include <cstdlib>
#include <cwchar>
#include <condition_variable>
#include <cstdint>
#include <iostream>
#include <memory>
#include <mutex>
#include <set>
#include <string>
#include <vector>
#include <utility>
#include <optional>
#include <thread>

#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.Devices.Enumeration.h>
#include <winrt/base.h>

#pragma comment(lib, "dnsapi.lib")
#pragma comment(lib, "windowsapp.lib")
#pragma comment(lib, "winspool.lib")

using namespace winrt;
using namespace winrt::Windows::Devices::Enumeration;



namespace {

std::string WideToUtf8(const std::wstring& value) {
    if (value.empty()) return {};
    const int length = WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS,
        value.data(), static_cast<int>(value.size()), nullptr, 0, nullptr, nullptr);
    if (length <= 0) return {};
    std::string output(static_cast<size_t>(length), '\0');
    if (WideCharToMultiByte(CP_UTF8, WC_ERR_INVALID_CHARS, value.data(),
        static_cast<int>(value.size()), output.data(), length, nullptr, nullptr) != length) {
        return {};
    }
    return output;
}

std::string EscapePath(const std::wstring& path) {
    const std::string utf8 = WideToUtf8(path);
    static constexpr char HEX[] = "0123456789ABCDEF";
    std::string output;
    output.reserve(utf8.size());
    for (unsigned char value : utf8) {
        const bool safe =
            (value >= 'a' && value <= 'z') ||
            (value >= 'A' && value <= 'Z') ||
            (value >= '0' && value <= '9') ||
            value == '/' || value == '-' || value == '.' || value == '_' || value == '~' ||
            value == '!' || value == '$' || value == '&' || value == '\'' || value == '(' ||
            value == ')' || value == '*' || value == '+' || value == ',' || value == ';' ||
            value == '=' || value == ':' || value == '@';
        if (safe) {
            output.push_back(static_cast<char>(value));
        } else {
            output.push_back('%');
            output.push_back(HEX[value >> 4]);
            output.push_back(HEX[value & 0x0F]);
        }
    }
    return output;
}


constexpr wchar_t WSD_PROTOCOL_SELECTOR[] =
    L"System.Devices.Aep.ProtocolId:=\"{782232aa-a2f9-4993-971b-aedc551346b0}\"";

class WinRtApartment {
public:
    WinRtApartment() {
        winrt::init_apartment(winrt::apartment_type::multi_threaded);
    }
    ~WinRtApartment() {
        winrt::uninit_apartment();
    }
    WinRtApartment(const WinRtApartment&) = delete;
    WinRtApartment& operator=(const WinRtApartment&) = delete;
};

std::string Base64UrlEncode(const std::string& input) {
    static constexpr char ALPHABET[] =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    std::string output;
    uint32_t accumulator = 0;
    int bits = 0;
    for (unsigned char value : input) {
        accumulator = (accumulator << 8) | value;
        bits += 8;
        while (bits >= 6) {
            bits -= 6;
            output.push_back(ALPHABET[(accumulator >> bits) & 0x3F]);
        }
    }
    if (bits > 0) {
        output.push_back(ALPHABET[(accumulator << (6 - bits)) & 0x3F]);
    }
    return output;
}

std::optional<std::string> Base64UrlDecode(const std::string& input) {
    if (input.empty() || input.size() > 8192) return std::nullopt;
    std::string output;
    uint32_t accumulator = 0;
    int bits = 0;
    for (unsigned char value : input) {
        int digit = -1;
        if (value >= 'A' && value <= 'Z') digit = value - 'A';
        else if (value >= 'a' && value <= 'z') digit = value - 'a' + 26;
        else if (value >= '0' && value <= '9') digit = value - '0' + 52;
        else if (value == '-') digit = 62;
        else if (value == '_') digit = 63;
        if (digit < 0) return std::nullopt;
        accumulator = (accumulator << 6) | static_cast<uint32_t>(digit);
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            output.push_back(static_cast<char>((accumulator >> bits) & 0xFF));
        }
    }
    if (bits >= 6 || (bits > 0 && (accumulator & ((1U << bits) - 1U)) != 0)) {
        return std::nullopt;
    }
    if (output.empty()) return std::nullopt;
    return output;
}

std::wstring Utf8ToWide(const std::string& value) {
    if (value.empty()) return {};
    const int length = MultiByteToWideChar(
        CP_UTF8, MB_ERR_INVALID_CHARS, value.data(),
        static_cast<int>(value.size()), nullptr, 0);
    if (length <= 0) return {};
    std::wstring output(static_cast<size_t>(length), L'\0');
    if (MultiByteToWideChar(
        CP_UTF8, MB_ERR_INVALID_CHARS, value.data(),
        static_cast<int>(value.size()), output.data(), length) != length) {
        return {};
    }
    return output;
}

bool IsPresentWsdPrinter(const DeviceInformation& device) {
    const auto properties = device.Properties();

    // AEP Category is a boxed String[] (IPropertyValue), not an IVectorView.
    const auto categoryValue = properties.TryLookup(L"System.Devices.Aep.Category");
    const auto categoryProperty =
        categoryValue.try_as<winrt::Windows::Foundation::IPropertyValue>();
    if (!categoryProperty ||
        categoryProperty.Type() != winrt::Windows::Foundation::PropertyType::StringArray) {
        return false;
    }

    winrt::com_array<winrt::hstring> categories;
    categoryProperty.GetStringArray(categories);

    bool isPrinter = false;
    for (const auto& category : categories) {
        if (_wcsicmp(category.c_str(), L"Printer") == 0) {
            isPrinter = true;
            break;
        }
    }
    if (!isPrinter) return false;

    // AEP IsPresent is a boxed Boolean and excludes cached/offline endpoints.
    const auto presentValue = properties.TryLookup(L"System.Devices.Aep.IsPresent");
    const auto presentProperty =
        presentValue.try_as<winrt::Windows::Foundation::IPropertyValue>();
    return presentProperty &&
        presentProperty.Type() == winrt::Windows::Foundation::PropertyType::Boolean &&
        presentProperty.GetBoolean();
}


std::string JsonQuote(const std::wstring& value) {
    const std::string utf8 = WideToUtf8(value);
    std::string output = "\"";
    static constexpr char HEX[] = "0123456789abcdef";
    for (unsigned char character : utf8) {
        switch (character) {
        case '"': output += "\\\""; break;
        case '\\': output += "\\\\"; break;
        case '\b': output += "\\b"; break;
        case '\f': output += "\\f"; break;
        case '\n': output += "\\n"; break;
        case '\r': output += "\\r"; break;
        case '\t': output += "\\t"; break;
        default:
            if (character < 0x20) {
                output += "\\u00";
                output.push_back(HEX[(character >> 4) & 0x0F]);
                output.push_back(HEX[character & 0x0F]);
            } else {
                output.push_back(static_cast<char>(character));
            }
            break;
        }
    }
    output.push_back('"');
    return output;
}

std::string JsonBooleanOrNull(int value) {
    if (value < 0) return "null";
    return value == 0 ? "false" : "true";
}

int QueryPrinterCapabilities(const std::string& encodedPrinterName) {
    const auto decodedName = Base64UrlDecode(encodedPrinterName);
    if (!decodedName || decodedName->find('\0') != std::string::npos || decodedName->size() > 255) {
        std::cout << "{\"color\":null,\"duplex\":null,\"maximumCopies\":null,"
                     "\"paperSizes\":null,\"resolutionsDpi\":null}\n";
        return 2;
    }

    const std::wstring printerName = Utf8ToWide(*decodedName);
    if (printerName.empty()) {
        std::cout << "{\"color\":null,\"duplex\":null,\"maximumCopies\":null,"
                     "\"paperSizes\":null,\"resolutionsDpi\":null}\n";
        return 2;
    }

    HANDLE printerHandle = nullptr;
    if (!OpenPrinterW(const_cast<LPWSTR>(printerName.c_str()), &printerHandle, nullptr)) {
        std::cout << "{\"color\":null,\"duplex\":null,\"maximumCopies\":null,"
                     "\"paperSizes\":null,\"resolutionsDpi\":null}\n";
        return 0;
    }

    std::string json =
        "{\"color\":null,\"duplex\":null,\"maximumCopies\":null,"
        "\"paperSizes\":null,\"resolutionsDpi\":null}";

    DWORD bytesNeeded = 0;
    GetPrinterW(printerHandle, 2, nullptr, 0, &bytesNeeded);
    if (bytesNeeded > 0 && bytesNeeded <= 1024 * 1024) {
        std::vector<BYTE> printerBuffer(bytesNeeded);
        if (GetPrinterW(printerHandle, 2, printerBuffer.data(), bytesNeeded, &bytesNeeded)) {
            const auto* info = reinterpret_cast<const PRINTER_INFO_2W*>(printerBuffer.data());
            if (info->pPortName != nullptr && *info->pPortName != L'\0') {
                const std::wstring portName(info->pPortName);
                const int color = DeviceCapabilitiesW(
                    printerName.c_str(), portName.c_str(), DC_COLORDEVICE, nullptr, nullptr);
                const int duplex = DeviceCapabilitiesW(
                    printerName.c_str(), portName.c_str(), DC_DUPLEX, nullptr, nullptr);
                const int copies = DeviceCapabilitiesW(
                    printerName.c_str(), portName.c_str(), DC_COPIES, nullptr, nullptr);

                std::string colorJson = JsonBooleanOrNull(color);
                std::string duplexJson = JsonBooleanOrNull(duplex);
                std::string copiesJson = copies > 0 && copies <= 100000
                    ? std::to_string(copies)
                    : "null";

                std::string papersJson = "null";
                const int paperCount = DeviceCapabilitiesW(
                    printerName.c_str(), portName.c_str(), DC_PAPERNAMES, nullptr, nullptr);
                if (paperCount > 0 && paperCount <= 256) {
                    std::vector<wchar_t> paperBuffer(static_cast<size_t>(paperCount) * 64, L'\0');
                    const int actualPapers = DeviceCapabilitiesW(
                        printerName.c_str(), portName.c_str(), DC_PAPERNAMES,
                        paperBuffer.data(), nullptr);
                    if (actualPapers > 0) {
                        papersJson = "[";
                        const int boundedCount = (std::min)(actualPapers, paperCount);
                        for (int index = 0; index < boundedCount; ++index) {
                            const wchar_t* item = paperBuffer.data() + static_cast<size_t>(index) * 64;
                            const size_t length = wcsnlen_s(item, 64);
                            if (length == 0) continue;
                            if (papersJson.size() > 1) papersJson.push_back(',');
                            papersJson += JsonQuote(std::wstring(item, length));
                        }
                        papersJson.push_back(']');
                        if (papersJson == "[]") papersJson = "null";
                    }
                }

                std::string resolutionsJson = "null";
                const int resolutionCount = DeviceCapabilitiesW(
                    printerName.c_str(), portName.c_str(), DC_ENUMRESOLUTIONS, nullptr, nullptr);
                if (resolutionCount > 0 && resolutionCount <= 256) {
                    std::vector<LONG> resolutionBuffer(static_cast<size_t>(resolutionCount) * 2, 0);
                    const int actualResolutions = DeviceCapabilitiesW(
                        printerName.c_str(), portName.c_str(), DC_ENUMRESOLUTIONS,
                        reinterpret_cast<LPWSTR>(resolutionBuffer.data()), nullptr);
                    if (actualResolutions > 0) {
                        resolutionsJson = "[";
                        const int boundedCount = (std::min)(actualResolutions, resolutionCount);
                        for (int index = 0; index < boundedCount; ++index) {
                            const LONG x = resolutionBuffer[static_cast<size_t>(index) * 2];
                            const LONG y = resolutionBuffer[static_cast<size_t>(index) * 2 + 1];
                            if (x <= 0 || y <= 0 || x > 9600 || y > 9600) continue;
                            if (resolutionsJson.size() > 1) resolutionsJson.push_back(',');
                            resolutionsJson += "{\"x\":" + std::to_string(x) +
                                ",\"y\":" + std::to_string(y) + "}";
                        }
                        resolutionsJson.push_back(']');
                        if (resolutionsJson == "[]") resolutionsJson = "null";
                    }
                }

                json = "{\"color\":" + colorJson +
                    ",\"duplex\":" + duplexJson +
                    ",\"maximumCopies\":" + copiesJson +
                    ",\"paperSizes\":" + papersJson +
                    ",\"resolutionsDpi\":" + resolutionsJson + "}";
            }
        }
    }

    ClosePrinter(printerHandle);
    std::cout << json << '\n';
    return 0;
}

struct WsdDiscoveryResult {
    std::vector<std::string> records;
    bool timedOut = false;
    bool stoppedUnexpectedly = false;
    bool failed = false;
};

struct WsdDiscoveryState {
    std::mutex recordsMutex;
    std::mutex watcherMutex;
    std::condition_variable watcherCondition;
    std::vector<std::string> records;
    bool enumerationComplete = false;
    bool stopped = false;
    bool timedOut = false;
    bool stoppedUnexpectedly = false;
    bool failed = false;
};

WsdDiscoveryResult DiscoverWsdPrinters(DWORD timeoutMs) {
    // Watcher callbacks capture shared state by value. If Windows delivers a
    // delayed callback while the watcher is shutting down, its data remains alive.
    auto state = std::make_shared<WsdDiscoveryState>();
    try {
        WinRtApartment apartment;
        auto requestedProperties = winrt::single_threaded_vector<winrt::hstring>({
            L"System.Devices.Aep.Category",
            L"System.Devices.Aep.IsPresent"
        });
        auto watcher = DeviceInformation::CreateWatcher(
            WSD_PROTOCOL_SELECTOR, requestedProperties, DeviceInformationKind::AssociationEndpoint);

        auto addedToken = watcher.Added(
            [state](DeviceWatcher const&, DeviceInformation const& device) {
                try {
                    if (!IsPresentWsdPrinter(device)) return;
                    const auto pairing = device.Pairing();
                    const bool canPair = pairing.CanPair();
                    const bool isPaired = pairing.IsPaired();

                    const std::string id = WideToUtf8(std::wstring(device.Id().c_str()));
                    std::string name = WideToUtf8(std::wstring(device.Name().c_str()));
                    if (id.empty()) return;
                    if (name.empty()) name = "WSD printer";

                    const std::string record =
                        "WSD\t" + Base64UrlEncode(id) + "\t" +
                        Base64UrlEncode(name) + "\t" +
                        (canPair ? "1" : "0") + "\t" +
                        (isPaired ? "1" : "0");

                    std::lock_guard<std::mutex> lock(state->recordsMutex);
                    state->records.push_back(record);
                } catch (winrt::hresult_error const&) {
                    // An endpoint can disappear while the watcher is updating.
                }
            });

        auto enumerationToken = watcher.EnumerationCompleted(
            [state](DeviceWatcher const&, winrt::Windows::Foundation::IInspectable const&) {
                {
                    std::lock_guard<std::mutex> lock(state->watcherMutex);
                    state->enumerationComplete = true;
                }
                state->watcherCondition.notify_all();
            });

        auto stoppedToken = watcher.Stopped(
            [state](DeviceWatcher const&, DeviceWatcherStoppedEventArgs const&) {
                {
                    std::lock_guard<std::mutex> lock(state->watcherMutex);
                    state->stopped = true;
                }
                state->watcherCondition.notify_all();
            });

        watcher.Start();
        {
            std::unique_lock<std::mutex> lock(state->watcherMutex);
            const bool signaled = state->watcherCondition.wait_for(
                lock, std::chrono::milliseconds(timeoutMs), [&] {
                    return state->enumerationComplete || state->stopped;
                });
            state->timedOut = !signaled && !state->enumerationComplete;
            state->stoppedUnexpectedly = state->stopped && !state->enumerationComplete;
        }

        const auto watcherStatus = watcher.Status();
        if (watcherStatus == DeviceWatcherStatus::Started ||
            watcherStatus == DeviceWatcherStatus::EnumerationCompleted) {
            watcher.Stop();
        }

        {
            std::unique_lock<std::mutex> lock(state->watcherMutex);
            state->watcherCondition.wait_for(lock, std::chrono::seconds(2), [&] {
                return state->stopped;
            });
        }

        watcher.Added(addedToken);
        watcher.EnumerationCompleted(enumerationToken);
        watcher.Stopped(stoppedToken);
    } catch (winrt::hresult_error const& error) {
        state->failed = true;
        std::wcerr << L"WSD_DISCOVERY_WARNING: " << error.message().c_str() << std::endl;
    } catch (...) {
        state->failed = true;
        std::wcerr << L"WSD_DISCOVERY_WARNING: Windows device enumeration failed." << std::endl;
    }

    std::vector<std::string> records;
    {
        std::lock_guard<std::mutex> lock(state->recordsMutex);
        records = state->records;
    }
    std::sort(records.begin(), records.end());
    records.erase(std::unique(records.begin(), records.end()), records.end());
    return { std::move(records), state->timedOut, state->stoppedUnexpectedly, state->failed };
}

struct WsdLookupState {
    std::mutex watcherMutex;
    std::condition_variable watcherCondition;
    std::optional<DeviceInformation> selected;
    bool enumerationComplete = false;
    bool stopped = false;
    bool timedOut = false;
    bool stoppedUnexpectedly = false;
};

struct WsdPrinterLookupResult {
    std::optional<DeviceInformation> device;
    bool timedOut = false;
    bool stoppedUnexpectedly = false;
};

WsdPrinterLookupResult FindPresentWsdPrinter(
    const std::wstring& expectedId, DWORD timeoutMs) {
    // PairWsdPrinter owns the WinRT apartment for this helper's lifetime.
    // Shared state prevents delayed watcher callbacks from using dead stack references.
    auto state = std::make_shared<WsdLookupState>();
    auto requestedProperties = winrt::single_threaded_vector<winrt::hstring>({
        L"System.Devices.Aep.Category",
        L"System.Devices.Aep.IsPresent"
    });
    auto watcher = DeviceInformation::CreateWatcher(
        WSD_PROTOCOL_SELECTOR, requestedProperties, DeviceInformationKind::AssociationEndpoint);

    auto addedToken = watcher.Added(
        [state, expectedId](DeviceWatcher const&, DeviceInformation const& device) {
            try {
                if (device.Id() != expectedId || !IsPresentWsdPrinter(device)) return;

                {
                    std::lock_guard<std::mutex> lock(state->watcherMutex);
                    if (!state->selected.has_value()) state->selected = device;
                }
                state->watcherCondition.notify_all();
            } catch (winrt::hresult_error const&) {
                // The selected endpoint may disappear during the recheck.
            }
        });

    auto enumerationToken = watcher.EnumerationCompleted(
        [state](DeviceWatcher const&, winrt::Windows::Foundation::IInspectable const&) {
            {
                std::lock_guard<std::mutex> lock(state->watcherMutex);
                state->enumerationComplete = true;
            }
            state->watcherCondition.notify_all();
        });

    auto stoppedToken = watcher.Stopped(
        [state](DeviceWatcher const&, DeviceWatcherStoppedEventArgs const&) {
            {
                std::lock_guard<std::mutex> lock(state->watcherMutex);
                state->stopped = true;
            }
            state->watcherCondition.notify_all();
        });

    watcher.Start();
    WsdPrinterLookupResult result;
    {
        std::unique_lock<std::mutex> lock(state->watcherMutex);
        const bool signaled = state->watcherCondition.wait_for(
            lock, std::chrono::milliseconds(timeoutMs), [&] {
                return state->selected.has_value() || state->enumerationComplete || state->stopped;
            });
        state->timedOut = !signaled && !state->selected.has_value() && !state->enumerationComplete;
        state->stoppedUnexpectedly = state->stopped && !state->selected.has_value() && !state->enumerationComplete;
        // Freeze the outcome at the deadline; late Added events cannot change
        // a timeout into a successful recheck after the caller has moved on.
        result = { state->selected, state->timedOut, state->stoppedUnexpectedly };
    }

    const auto watcherStatus = watcher.Status();
    if (watcherStatus == DeviceWatcherStatus::Started ||
        watcherStatus == DeviceWatcherStatus::EnumerationCompleted) {
        watcher.Stop();
    }

    {
        std::unique_lock<std::mutex> lock(state->watcherMutex);
        state->watcherCondition.wait_for(lock, std::chrono::seconds(2), [&] {
            return state->stopped;
        });
    }

    watcher.Added(addedToken);
    watcher.EnumerationCompleted(enumerationToken);
    watcher.Stopped(stoppedToken);
    return result;
}

int PairWsdPrinter(const std::string& encodedDeviceId) {
    const auto decodedId = Base64UrlDecode(encodedDeviceId);
    if (!decodedId) {
        std::cout << "WSD_PAIR_RESULT\tNOT_FOUND\n";
        return 2;
    }

    try {
        WinRtApartment apartment;
        const auto expectedId = Utf8ToWide(*decodedId);
        if (expectedId.empty()) {
            std::cout << "WSD_PAIR_RESULT\tNOT_FOUND\n";
            return 2;
        }

        // Recheck the exact selected endpoint with DeviceWatcher. Microsoft
        // recommends watchers for network-backed AssociationEndpoint objects;
        // A full network snapshot can delay results while discovery completes.
        const auto lookup = FindPresentWsdPrinter(expectedId, 10000);

        if (!lookup.device) {
            if (lookup.timedOut) {
                std::cout << "WSD_PAIR_RESULT\tTIMEOUT\n";
                return 4;
            }
            if (lookup.stoppedUnexpectedly) {
                std::cout << "WSD_PAIR_RESULT\tFAILED\n";
                return 3;
            }
            std::cout << "WSD_PAIR_RESULT\tNOT_FOUND\n";
            return 2;
        }

        const auto pairing = lookup.device->Pairing();
        if (pairing.IsPaired()) {
            std::cout << "WSD_PAIR_RESULT\tALREADY_PAIRED\n";
            return 0;
        }
        if (!pairing.CanPair()) {
            std::cout << "WSD_PAIR_RESULT\tNOT_PAIRABLE\n";
            return 2;
        }

        // Basic pairing leaves any required consent ceremony to Windows.
        const auto result = pairing.PairAsync().get();
        if (result.Status() == DevicePairingResultStatus::Paired) {
            std::cout << "WSD_PAIR_RESULT\tPAIRED\n";
            return 0;
        }
        if (result.Status() == DevicePairingResultStatus::AlreadyPaired) {
            std::cout << "WSD_PAIR_RESULT\tALREADY_PAIRED\n";
            return 0;
        }
        if (result.Status() == DevicePairingResultStatus::PairingCanceled) {
            std::cout << "WSD_PAIR_RESULT\tCANCELED\n";
            return 0;
        }
        if (result.Status() == DevicePairingResultStatus::NotReadyToPair) {
            std::cout << "WSD_PAIR_RESULT\tNOT_PAIRABLE\n";
            return 2;
        }

        std::cout << "WSD_PAIR_RESULT\tFAILED\t"
            << static_cast<int>(result.Status()) << '\n';
        return 3;
    } catch (winrt::hresult_error const& error) {
        std::wcerr << L"WSD_PAIR_ERROR: " << error.message().c_str() << std::endl;
        std::cout << "WSD_PAIR_RESULT\tFAILED\n";
        return 3;
    } catch (...) {
        std::wcerr << L"WSD_PAIR_ERROR: Windows could not complete WSD pairing." << std::endl;
        std::cout << "WSD_PAIR_RESULT\tFAILED\n";
        return 3;
    }
}


struct Discovery;

struct BrowseContext {
    Discovery* owner = nullptr;
    std::string scheme;
    bool completed = false;
};

struct ResolveContext {
    Discovery* owner = nullptr;
    std::wstring serviceName;
    std::string scheme;
    DNS_SERVICE_CANCEL cancel{};
};

class Discovery {
public:
    void Run(DWORD timeoutMs) {
        browseContexts_[0] = { this, "ipp", false };
        browseContexts_[1] = { this, "ipps", false };
        browseContexts_[2] = { this, "lpd", false };

        const std::array<std::wstring, 3> queryNames = {
            L"_ipp._tcp.local",
            L"_ipps._tcp.local",
            L"_printer._tcp.local"
        };

        for (size_t index = 0; index < queryNames.size(); ++index) {
            {
                std::lock_guard<std::mutex> lock(mutex_);
                ++pendingBrowses_;
            }

            DNS_SERVICE_BROWSE_REQUEST request{};
            request.Version = DNS_QUERY_REQUEST_VERSION1;
            request.InterfaceIndex = 0;
            request.QueryName = const_cast<PWSTR>(queryNames[index].c_str());
            request.pBrowseCallback = &Discovery::BrowseCallback;
            request.pQueryContext = &browseContexts_[index];

            const DNS_STATUS status = DnsServiceBrowse(&request, &browseCancels_[index]);
            if (status != DNS_REQUEST_PENDING) {
                FinishBrowse(&browseContexts_[index]);
                AddError(L"DnsServiceBrowse failed with status " + std::to_wstring(status));
            }
        }

        Sleep(timeoutMs);

        for (auto& cancel : browseCancels_) {
            if (cancel.reserved != nullptr) {
                const DNS_STATUS cancelStatus = DnsServiceBrowseCancel(&cancel);
                if (cancelStatus != ERROR_SUCCESS) {
                    AddError(L"DnsServiceBrowseCancel failed with status " + std::to_wstring(cancelStatus));
                }
            }
        }

        // DnsServiceBrowseCancel produces one final ERROR_CANCELLED callback.
        // Wait for every accepted browse to finish before deciding that search
        // is empty or taking the final result snapshot.
        {
            std::unique_lock<std::mutex> lock(mutex_);
            const bool allBrowsesCompleted = resolveCompleted_.wait_for(
                lock, std::chrono::seconds(2), [this] {
                    return pendingBrowses_ == 0;
                });
            browseTimedOut_ = !allBrowsesCompleted && pendingBrowses_ > 0;
        }

        {
            std::unique_lock<std::mutex> lock(mutex_);
            const bool allResolvesCompleted = resolveCompleted_.wait_for(
                lock, std::chrono::seconds(2), [this] {
                    return pendingResolves_ == 0;
                });
            resolveTimedOut_ = !allResolvesCompleted && pendingResolves_ > 0;
        }

        std::vector<std::string> output;
        std::vector<std::wstring> errors;
        {
            std::lock_guard<std::mutex> lock(mutex_);
            // Freeze the externally visible result set at the same time as the
            // output snapshot. DNS-SD callbacks may finish after the bounded
            // wait; late results must not change HasResults() after output is
            // already committed.
            resultsFinalized_ = true;
            hasResults_ = !results_.empty();
            output.assign(results_.begin(), results_.end());
            errors = errors_;
        }

        if (output.empty() && !errors.empty()) {
            std::wcerr << L"WINDOWS_PRINTER_DISCOVERY_FAILED: ";
            for (size_t index = 0; index < errors.size(); ++index) {
                if (index) std::wcerr << L"; ";
                std::wcerr << errors[index];
            }
            std::wcerr << std::endl;
            exitCode_ = 1;
            return;
        }

        for (const auto& uri : output) {
            std::cout << uri << '\n';
        }
    }

    int ExitCode() const { return exitCode_; }

    bool TimedOut() const { return browseTimedOut_ || resolveTimedOut_; }

    bool HasResults() {
        std::lock_guard<std::mutex> lock(mutex_);
        return hasResults_;
    }

    void OnBrowse(DWORD status, BrowseContext* context, PDNS_RECORD records) {
        if (status == ERROR_SUCCESS && records != nullptr) {
            for (PDNS_RECORD record = records; record != nullptr; record = record->pNext) {
                if (record->wType != DNS_TYPE_PTR) continue;
                const wchar_t* instance = record->Data.PTR.pNameHost;
                if (instance == nullptr || *instance == L'\0') continue;
                Resolve(instance, context->scheme);
            }
        } else if (status != ERROR_SUCCESS) {
            if (status != ERROR_CANCELLED) {
                AddError(L"Bonjour browse callback returned status " + std::to_wstring(status));
            }
            FinishBrowse(context);
        }

        if (records != nullptr) {
            DnsRecordListFree(records, DnsFreeRecordList);
        }
    }

    void OnResolve(DWORD status, ResolveContext* context, PDNS_SERVICE_INSTANCE instance) {
        if (status == ERROR_SUCCESS && instance != nullptr &&
            instance->pszHostName != nullptr && instance->wPort > 0) {
            std::wstring resourcePath;
            for (DWORD index = 0; index < instance->dwPropertyCount; ++index) {
                if (instance->keys == nullptr || instance->values == nullptr ||
                    instance->keys[index] == nullptr || instance->values[index] == nullptr) {
                    continue;
                }
                if (_wcsicmp(instance->keys[index], L"rp") == 0) {
                    resourcePath = instance->values[index];
                    break;
                }
            }

            if (resourcePath.empty() && context->scheme == "lpd") {
                // CUPS' LPD discovery uses "/" when the TXT record omits rp.
                resourcePath = L"/";
            }

            if (!resourcePath.empty()) {
                std::wstring host(instance->pszHostName);
                while (!host.empty() && host.back() == L'.') host.pop_back();
                std::string hostUtf8 = WideToUtf8(host);
                std::string escapedPath = EscapePath(resourcePath);
                if (!hostUtf8.empty() && !escapedPath.empty()) {
                    std::string uri = context->scheme + "://" + hostUtf8 + ":" +
                        std::to_string(instance->wPort);
                    if (escapedPath.front() != '/') uri.push_back('/');
                    uri += escapedPath;
                    std::lock_guard<std::mutex> lock(mutex_);
                    if (!resultsFinalized_) {
                        results_.insert(std::move(uri));
                    }
                }
            }
        } else if (status != ERROR_SUCCESS && status != ERROR_CANCELLED) {
            AddError(L"Bonjour service resolve returned status " + std::to_wstring(status));
        }

        if (instance != nullptr) {
            DnsServiceFreeInstance(instance);
        }

        {
            std::lock_guard<std::mutex> lock(mutex_);
            if (pendingResolves_ > 0) --pendingResolves_;
        }
        resolveCompleted_.notify_all();
    }

private:
    void FinishBrowse(BrowseContext* context) {
        if (context == nullptr) return;

        bool completedNow = false;
        {
            std::lock_guard<std::mutex> lock(mutex_);
            if (!context->completed) {
                context->completed = true;
                if (pendingBrowses_ > 0) --pendingBrowses_;
                completedNow = true;
            }
        }
        if (completedNow) resolveCompleted_.notify_all();
    }

    static VOID WINAPI BrowseCallback(DWORD status, PVOID queryContext, PDNS_RECORD records) {
        auto* context = static_cast<BrowseContext*>(queryContext);
        if (context != nullptr && context->owner != nullptr) {
            context->owner->OnBrowse(status, context, records);
        } else if (records != nullptr) {
            DnsRecordListFree(records, DnsFreeRecordList);
        }
    }

    static VOID WINAPI ResolveCallback(DWORD status, PVOID queryContext, PDNS_SERVICE_INSTANCE instance) {
        auto* context = static_cast<ResolveContext*>(queryContext);
        if (context != nullptr && context->owner != nullptr) {
            context->owner->OnResolve(status, context, instance);
        } else if (instance != nullptr) {
            DnsServiceFreeInstance(instance);
        }
    }

    void Resolve(const std::wstring& serviceName, const std::string& scheme) {
        auto context = std::make_unique<ResolveContext>();
        context->owner = this;
        context->serviceName = serviceName;
        context->scheme = scheme;
        ResolveContext* rawContext = context.get();

        {
            std::lock_guard<std::mutex> lock(mutex_);
            resolveContexts_.push_back(std::move(context));
            ++pendingResolves_;
        }

        DNS_SERVICE_RESOLVE_REQUEST request{};
        request.Version = DNS_QUERY_REQUEST_VERSION1;
        request.InterfaceIndex = 0;
        request.QueryName = const_cast<PWSTR>(rawContext->serviceName.c_str());
        request.pResolveCompletionCallback = &Discovery::ResolveCallback;
        request.pQueryContext = rawContext;

        const DNS_STATUS status = DnsServiceResolve(&request, &rawContext->cancel);
        if (status != DNS_REQUEST_PENDING) {
            AddError(L"DnsServiceResolve failed with status " + std::to_wstring(status));
            {
                std::lock_guard<std::mutex> lock(mutex_);
                if (pendingResolves_ > 0) --pendingResolves_;
            }
            resolveCompleted_.notify_all();
        }
    }

    void AddError(const std::wstring& message) {
        std::lock_guard<std::mutex> lock(mutex_);
        errors_.push_back(message);
    }

    std::array<BrowseContext, 3> browseContexts_{};
    std::array<DNS_SERVICE_CANCEL, 3> browseCancels_{};
    std::vector<std::unique_ptr<ResolveContext>> resolveContexts_;
    std::mutex mutex_;
    std::condition_variable resolveCompleted_;
    size_t pendingBrowses_ = 0;
    size_t pendingResolves_ = 0;
    std::set<std::string> results_;
    std::vector<std::wstring> errors_;
    bool resultsFinalized_ = false;
    bool hasResults_ = false;
    bool browseTimedOut_ = false;
    bool resolveTimedOut_ = false;
    int exitCode_ = 0;
};

} // namespace

int wmain(int argc, wchar_t** argv) {
    if (argc >= 2 && wcscmp(argv[1], L"--version") == 0) {
        std::wcout << L"brightdesk-ipp-discovery 0.1.0" << std::endl;
        return 0;
    }

    if (argc >= 3 && wcscmp(argv[1], L"--pair-wsd") == 0) {
        return PairWsdPrinter(WideToUtf8(std::wstring(argv[2])));
    }

    if (argc >= 3 && wcscmp(argv[1], L"--capabilities") == 0) {
        return QueryPrinterCapabilities(WideToUtf8(std::wstring(argv[2])));
    }

    DWORD timeoutMs = 5000;
    for (int index = 1; index + 1 < argc; ++index) {
        if (wcscmp(argv[index], L"--timeout") == 0) {
            try {
                timeoutMs = static_cast<DWORD>(std::stoul(argv[index + 1]) * 1000UL);
            } catch (...) {
                timeoutMs = 5000;
            }
            break;
        }
    }
    timeoutMs = (std::max<DWORD>)(1000, (std::min<DWORD>)(timeoutMs, 30000));

    // Run WinDNS and WSD DeviceWatcher discovery concurrently.
    WsdDiscoveryResult wsdResult;
    std::thread wsdThread([&wsdResult, timeoutMs] {
        wsdResult = DiscoverWsdPrinters(timeoutMs);
    });

    // The process remains alive while WinDNS invokes its asynchronous callbacks.
    auto* discovery = new Discovery();
    discovery->Run(timeoutMs);
    wsdThread.join();

    for (const auto& record : wsdResult.records) {
        std::cout << record << '\n';
    }

    // A successful result from either discovery method is useful, even if
    // the other method was incomplete. Never turn a partial empty search
    // into a successful "no printers found" response.
    if (!wsdResult.records.empty() || discovery->HasResults()) return 0;
    if (discovery->TimedOut()) {
        std::cerr << "WINDOWS_PRINTER_DISCOVERY_TIMEOUT: Windows did not finish resolving advertised printer services." << std::endl;
        return 4;
    }
    if (discovery->ExitCode() != 0) return discovery->ExitCode();

    if (wsdResult.timedOut) {
        std::cerr << "WINDOWS_PRINTER_DISCOVERY_TIMEOUT: Windows did not finish WSD printer enumeration." << std::endl;
        return 4;
    }
    if (wsdResult.stoppedUnexpectedly || wsdResult.failed) {
        std::cerr << "WINDOWS_PRINTER_DISCOVERY_FAILED: Windows WSD printer enumeration did not complete." << std::endl;
        return 1;
    }
    return 0;
}
