#![forbid(unsafe_code)]

// Stable identity used by future Brightdesk Rust-to-host adapters.
pub const ENGINE_NAME: &str = "Brightdesk Rust Core";
// Increment this only when the host-facing contract changes incompatibly.
pub const ENGINE_PROTOCOL_VERSION: u16 = 1;
pub const ENGINE_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct EngineInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub protocol_version: u16,
}

#[must_use]
pub const fn engine_info() -> EngineInfo {
    EngineInfo {
        name: ENGINE_NAME,
        version: ENGINE_VERSION,
        protocol_version: ENGINE_PROTOCOL_VERSION,
    }
}

#[must_use]
pub const fn supports_protocol(candidate: u16) -> bool {
    candidate == ENGINE_PROTOCOL_VERSION
}

/// Deterministic, dependency-free text metrics shared by Brightdesk apps.
/// Counts Unicode scalar values, whitespace-separated words, and logical lines.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct TextMetrics {
    pub characters: usize,
    pub words: usize,
    pub lines: usize,
}

#[must_use]
pub fn analyze_text(input: &str) -> TextMetrics {
    TextMetrics {
        characters: input.chars().count(),
        words: input.split_whitespace().count(),
        lines: input.lines().count(),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        analyze_text, engine_info, supports_protocol, TextMetrics, ENGINE_NAME,
        ENGINE_PROTOCOL_VERSION,
    };

    #[test]
    fn engine_info_exposes_the_stable_core_contract() {
        let info = engine_info();
        assert_eq!(info.name, ENGINE_NAME);
        assert_eq!(info.version, env!("CARGO_PKG_VERSION"));
        assert_eq!(info.protocol_version, ENGINE_PROTOCOL_VERSION);
    }

    #[test]
    fn protocol_negotiation_accepts_only_the_current_version() {
        assert!(supports_protocol(ENGINE_PROTOCOL_VERSION));
        assert!(!supports_protocol(ENGINE_PROTOCOL_VERSION + 1));
        assert!(!supports_protocol(0));
    }

    #[test]
    fn text_metrics_count_unicode_text_without_byte_length_errors() {
        assert_eq!(
            analyze_text("Café 世界"),
            TextMetrics {
                characters: 7,
                words: 2,
                lines: 1,
            }
        );
    }

    #[test]
    fn text_metrics_handle_empty_and_multiline_input() {
        assert_eq!(analyze_text(""), TextMetrics::default());
        assert_eq!(
            analyze_text("one two\nthree\n"),
            TextMetrics {
                characters: 14,
                words: 3,
                lines: 2,
            }
        );
    }
}
