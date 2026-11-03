use std::io::{self, BufRead, Write};

use brightdesk_rust_core::analyze_text;

fn decode_hex(input: &str) -> Result<String, &'static str> {
    if input.len() & 1 == 1 {
        return Err("invalid_hex_length");
    }

    let mut bytes = Vec::with_capacity(input.len() / 2);
    for pair in input.as_bytes().chunks_exact(2) {
        let high = hex_value(pair[0]).ok_or("invalid_hex_digit")?;
        let low = hex_value(pair[1]).ok_or("invalid_hex_digit")?;
        bytes.push((high << 4) | low);
    }

    String::from_utf8(bytes).map_err(|_| "invalid_utf8")
}

fn hex_value(value: u8) -> Option<u8> {
    match value {
        b'0'..=b'9' => Some(value - b'0'),
        b'a'..=b'f' => Some(value - b'a' + 10),
        b'A'..=b'F' => Some(value - b'A' + 10),
        _ => None,
    }
}

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::BufWriter::new(io::stdout().lock());

    for line in stdin.lock().lines() {
        let Ok(line) = line else { break };
        let Some((request_id, encoded)) = line.split_once('\t') else {
            continue;
        };

        let response = match decode_hex(encoded) {
            Ok(text) => {
                let metrics = analyze_text(&text);
                format!(
                    "{request_id}\t{}\t{}\t{}",
                    metrics.characters, metrics.words, metrics.lines
                )
            }
            Err(code) => format!("{request_id}\tERROR\t{code}"),
        };

        if writeln!(stdout, "{response}").is_err() || stdout.flush().is_err() {
            break;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::decode_hex;

    #[test]
    fn decodes_utf8_hex_without_losing_unicode() {
        assert_eq!(decode_hex("436166c3a920e4b896e7958c").unwrap(), "Café 世界");
    }

    #[test]
    fn rejects_invalid_hex_and_utf8() {
        assert_eq!(decode_hex("0"), Err("invalid_hex_length"));
        assert_eq!(decode_hex("zz"), Err("invalid_hex_digit"));
        assert_eq!(decode_hex("ff"), Err("invalid_utf8"));
    }
}
