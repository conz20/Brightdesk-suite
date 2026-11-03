//! Small, platform-independent primitives shared by Brightdesk engines.
//! This crate is an initial Rust foundation, not yet linked into the Electron app.

#![forbid(unsafe_code)]

use std::fmt;

/// A zero-based worksheet cell coordinate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct CellAddress {
    pub row: u32,
    pub column: u32,
}

impl CellAddress {
    /// Creates a cell address. Rows and columns are zero-based.
    #[must_use]
    pub const fn new(row: u32, column: u32) -> Self {
        Self { row, column }
    }

    /// Parses an A1-style address such as A1, BC27 or $C$9.
    ///
    /// # Errors
    /// Returns an error for empty, malformed, zero-row or out-of-range addresses.
    pub fn parse(input: &str) -> Result<Self, AddressError> {
        let normalized = input.trim().replace('$', "");
        if normalized.is_empty() {
            return Err(AddressError::Empty);
        }

        let split = normalized
            .find(|character: char| character.is_ascii_digit())
            .ok_or(AddressError::MissingRow)?;
        let (letters, digits) = normalized.split_at(split);
        if letters.is_empty() || digits.is_empty() {
            return Err(AddressError::InvalidFormat);
        }
        if !letters.bytes().all(|byte| byte.is_ascii_alphabetic())
            || !digits.bytes().all(|byte| byte.is_ascii_digit())
        {
            return Err(AddressError::InvalidFormat);
        }

        let mut column: u32 = 0;
        for byte in letters.bytes() {
            let value = u32::from(byte.to_ascii_uppercase() - b'A' + 1);
            column = column
                .checked_mul(26)
                .and_then(|current| current.checked_add(value))
                .ok_or(AddressError::OutOfRange)?;
        }
        let row_number: u32 = digits.parse().map_err(|_| AddressError::OutOfRange)?;
        if row_number == 0 {
            return Err(AddressError::ZeroRow);
        }

        Ok(Self { row: row_number - 1, column: column - 1 })
    }

    /// Formats the coordinate as an A1-style address.
    ///
    /// # Panics
    /// This method relies on the invariant that a base-26 remainder is below 26.
    #[must_use]
    pub fn to_a1(self) -> String {
        let mut value = self.column + 1;
        let mut letters = Vec::new();
        while value > 0 {
            let remainder = (value - 1) % 26;
            let letter_offset = u8::try_from(remainder).expect("remainder is below 26");
            letters.push(char::from(b'A' + letter_offset));
            value = (value - 1) / 26;
        }
        letters.reverse();
        format!("{}{}", letters.into_iter().collect::<String>(), self.row + 1)
    }
}

/// Errors returned while parsing a cell address.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AddressError {
    Empty,
    MissingRow,
    InvalidFormat,
    ZeroRow,
    OutOfRange,
}

impl fmt::Display for AddressError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::Empty => "cell address is empty",
            Self::MissingRow => "cell address has no row number",
            Self::InvalidFormat => "cell address must use A1 notation",
            Self::ZeroRow => "spreadsheet rows start at 1",
            Self::OutOfRange => "cell address is outside the supported range",
        };
        formatter.write_str(message)
    }
}

impl std::error::Error for AddressError {}

#[cfg(test)]
mod tests {
    use super::{AddressError, CellAddress};

    #[test]
    fn parses_single_and_multi_letter_columns() {
        assert_eq!(CellAddress::parse("A1"), Ok(CellAddress::new(0, 0)));
        assert_eq!(CellAddress::parse("BC27"), Ok(CellAddress::new(26, 54)));
        assert_eq!(CellAddress::parse("$C$9"), Ok(CellAddress::new(8, 2)));
    }

    #[test]
    fn formats_round_trip_addresses() {
        for input in ["A1", "Z1", "AA1", "BC27", "XFD1048576"] {
            let address = CellAddress::parse(input).expect("valid address");
            assert_eq!(address.to_a1(), input);
        }
    }

    #[test]
    fn rejects_invalid_addresses() {
        assert_eq!(CellAddress::parse(""), Err(AddressError::Empty));
        assert_eq!(CellAddress::parse("A0"), Err(AddressError::ZeroRow));
        assert_eq!(CellAddress::parse("12A"), Err(AddressError::InvalidFormat));
        assert_eq!(CellAddress::parse("A"), Err(AddressError::MissingRow));
    }
}
