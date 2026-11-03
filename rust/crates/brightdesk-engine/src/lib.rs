use napi::{Error, Result};
use napi_derive::napi;

const MAX_SOURCE_BYTES: usize = 8 * 1024 * 1024;
const MAX_EMBEDDING_DIMENSIONS: usize = 16_384;
const MAX_VECTOR_CANDIDATES: usize = 10_000;
const MAX_TOTAL_VECTOR_VALUES: usize = 1_000_000;

fn invalid(message: &str) -> Error {
    Error::from_reason(message.to_owned())
}

fn vector_norm(values: &[f64]) -> Result<f64> {
    if values.is_empty() || values.len() > MAX_EMBEDDING_DIMENSIONS {
        return Err(invalid("Embedding dimensions must be between 1 and 16384."));
    }
    if values.iter().any(|value| !value.is_finite()) {
        return Err(invalid("Embedding values must all be finite numbers."));
    }
    let squared_norm = values.iter().map(|value| value * value).sum::<f64>();
    let norm = squared_norm.sqrt();
    if !norm.is_finite() || norm <= f64::EPSILON {
        return Err(invalid("Embedding vector must have a finite, non-zero magnitude."));
    }
    Ok(norm)
}

#[napi(object)]
pub struct EngineInfo {
    pub engine: String,
    pub version: String,
    pub node_api_version: u32,
    pub capabilities: Vec<String>,
}

#[napi(object)]
pub struct SourceStats {
    pub bytes: u32,
    pub lines: u32,
    pub token_count: u32,
}

#[napi(object)]
pub struct RankedEmbedding {
    pub index: u32,
    pub score: f64,
}

#[napi(js_name = "engineInfo")]
pub fn engine_info() -> EngineInfo {
    EngineInfo {
        engine: "Brightdesk Rust Native Engine".to_owned(),
        version: env!("CARGO_PKG_VERSION").to_owned(),
        node_api_version: 8,
        capabilities: vec![
            "source-chunking".to_owned(),
            "source-analysis".to_owned(),
            "embedding-normalization".to_owned(),
            "cosine-similarity".to_owned(),
            "vector-ranking".to_owned(),
            "provider-neutral".to_owned(),
        ],
    }
}

#[napi(js_name = "normalizeEmbedding")]
pub fn normalize_embedding(values: Vec<f64>) -> Result<Vec<f64>> {
    let norm = vector_norm(&values)?;
    Ok(values.into_iter().map(|value| value / norm).collect())
}

fn cosine_similarity_with_norm(left: &[f64], left_norm: f64, right: &[f64]) -> Result<f64> {
    let right_norm = vector_norm(right)?;
    if left.len() != right.len() {
        return Err(invalid("Embedding vectors must have matching dimensions."));
    }
    let dot = left.iter().zip(right.iter()).map(|(a, b)| a * b).sum::<f64>();
    Ok((dot / (left_norm * right_norm)).clamp(-1.0, 1.0))
}

fn cosine_similarity_values(left: &[f64], right: &[f64]) -> Result<f64> {
    let left_norm = vector_norm(left)?;
    cosine_similarity_with_norm(left, left_norm, right)
}

#[napi(js_name = "cosineSimilarity")]
pub fn cosine_similarity(left: Vec<f64>, right: Vec<f64>) -> Result<f64> {
    cosine_similarity_values(&left, &right)
}

#[napi(js_name = "rankEmbeddings")]
pub fn rank_embeddings(
    query: Vec<f64>,
    candidates: Vec<Vec<f64>>,
    limit: Option<u32>,
) -> Result<Vec<RankedEmbedding>> {
    let query_norm = vector_norm(&query)?;
    if candidates.len() > MAX_VECTOR_CANDIDATES {
        return Err(invalid("Too many embedding candidates in one ranking request."));
    }
    let total_values = candidates.iter().map(Vec::len).sum::<usize>() + query.len();
    if total_values > MAX_TOTAL_VECTOR_VALUES {
        return Err(invalid("Embedding ranking request exceeds the vector-value limit."));
    }
    let mut ranked = Vec::with_capacity(candidates.len());
    for (index, candidate) in candidates.iter().enumerate() {
        let score = cosine_similarity_with_norm(&query, query_norm, candidate)?;
        ranked.push(RankedEmbedding {
            index: index as u32,
            score,
        });
    }
    ranked.sort_by(|left, right| {
        right
            .score
            .total_cmp(&left.score)
            .then_with(|| left.index.cmp(&right.index))
    });
    let take = limit.unwrap_or(ranked.len() as u32).min(ranked.len() as u32) as usize;
    ranked.truncate(take);
    Ok(ranked)
}

#[napi(js_name = "chunkSource")]
pub fn chunk_source(source: String, max_bytes: Option<u32>) -> Result<Vec<String>> {
    if source.len() > MAX_SOURCE_BYTES {
        return Err(invalid("Source text exceeds the 8 MiB processing limit."));
    }
    let limit = max_bytes.unwrap_or(2400) as usize;
    if !(128..=16_000).contains(&limit) {
        return Err(invalid("Chunk size must be between 128 and 16000 bytes."));
    }
    let mut chunks = Vec::new();
    let mut start = 0;
    while start < source.len() {
        let target = (start + limit).min(source.len());
        let mut end = target;
        while end > start && !source.is_char_boundary(end) {
            end -= 1;
        }
        if end < source.len() {
            if let Some(newline) = source[start..end].rfind('\n') {
                let preferred = start + newline + 1;
                if preferred > start + limit / 2 {
                    end = preferred;
                }
            }
        }
        if end == start {
            end = source[start..]
                .char_indices()
                .nth(1)
                .map(|(offset, _)| start + offset)
                .unwrap_or(source.len());
        }
        chunks.push(source[start..end].to_owned());
        start = end;
    }
    Ok(chunks)
}

#[napi(js_name = "analyzeSource")]
pub fn analyze_source(source: String) -> Result<SourceStats> {
    if source.len() > MAX_SOURCE_BYTES {
        return Err(invalid("Source text exceeds the 8 MiB processing limit."));
    }
    Ok(SourceStats {
        bytes: source.len() as u32,
        lines: source.lines().count() as u32,
        token_count: source.split_whitespace().count() as u32,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_vectors_without_changing_direction() {
        let normalized = normalize_embedding(vec![3.0, 4.0]).unwrap();
        assert!((normalized[0] - 0.6).abs() < 1e-10);
        assert!((normalized[1] - 0.8).abs() < 1e-10);
    }

    #[test]
    fn rejects_empty_zero_non_finite_and_oversized_vectors() {
        assert!(normalize_embedding(vec![]).is_err());
        assert!(normalize_embedding(vec![0.0, 0.0]).is_err());
        assert!(normalize_embedding(vec![f64::NAN]).is_err());
        assert!(normalize_embedding(vec![1.0; MAX_EMBEDDING_DIMENSIONS + 1]).is_err());
    }

    #[test]
    fn computes_cosine_similarity() {
        assert!((cosine_similarity(vec![1.0, 0.0], vec![2.0, 0.0]).unwrap() - 1.0).abs() < 1e-10);
        assert!((cosine_similarity(vec![1.0, 0.0], vec![-1.0, 0.0]).unwrap() + 1.0).abs() < 1e-10);
        assert!(cosine_similarity(vec![1.0], vec![1.0, 0.0]).is_err());
    }

    #[test]
    fn ranking_is_descending_and_stable_for_ties() {
        let ranked = rank_embeddings(
            vec![1.0, 0.0],
            vec![vec![0.0, 1.0], vec![1.0, 0.0], vec![2.0, 0.0]],
            None,
        ).unwrap();
        assert_eq!(ranked.iter().map(|item| item.index).collect::<Vec<_>>(), vec![1, 2, 0]);
    }

    #[test]
    fn chunks_preserve_unicode_and_respect_byte_limit() {
        let source = "🦀".repeat(100);
        let chunks = chunk_source(source.clone(), Some(128)).unwrap();
        assert!(chunks.iter().all(|chunk| chunk.len() <= 128));
        assert_eq!(chunks.concat(), source);
    }

    #[test]
    fn source_analysis_reports_bounded_statistics() {
        let stats = analyze_source("one two\nthree".to_owned()).unwrap();
        assert_eq!(stats.bytes, 13);
        assert_eq!(stats.lines, 2);
        assert_eq!(stats.token_count, 3);
    }


    #[test]
    fn ranking_respects_result_limit_and_candidate_bounds() {
        let ranked = rank_embeddings(
            vec![1.0, 0.0],
            vec![vec![0.0, 1.0], vec![1.0, 0.0], vec![2.0, 0.0]],
            Some(1),
        ).unwrap();
        assert_eq!(ranked.len(), 1);
        assert_eq!(ranked[0].index, 1);

        let too_many = vec![vec![1.0]; MAX_VECTOR_CANDIDATES + 1];
        assert!(rank_embeddings(vec![1.0], too_many, None).is_err());
    }
}