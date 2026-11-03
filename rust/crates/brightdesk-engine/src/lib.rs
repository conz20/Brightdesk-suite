use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const ENGINE_VERSION: &str = env!("CARGO_PKG_VERSION");
pub const EMBEDDING_DIMENSIONS: usize = 384;

#[derive(Debug, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
pub enum Request {
    Health,
    Chunk { content: String, #[serde(default)] language: Option<String>, #[serde(default = "default_chunk_bytes")] max_bytes: usize },
    Embed { text: String },
    Analyze { content: String, #[serde(default)] language: Option<String> },
}
fn default_chunk_bytes() -> usize { 2400 }

#[derive(Debug, Serialize)]
pub struct Response {
    pub ok: bool,
    pub engine: &'static str,
    pub version: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
impl Response {
    fn success(value: serde_json::Value) -> Self { Self { ok: true, engine: "brightdesk-engine", version: ENGINE_VERSION, result: Some(value), error: None } }
    fn failure(message: impl Into<String>) -> Self { Self { ok: false, engine: "brightdesk-engine", version: ENGINE_VERSION, result: None, error: Some(message.into()) } }
}
pub fn handle(request: Request) -> Response {
    match request {
        Request::Health => Response::success(serde_json::json!({"status":"ready","capabilities":["source_chunking","lexical_features","source_analysis","provider_neutral_protocol"]})),
        Request::Chunk { content, language, max_bytes } => {
            if !(128..=16000).contains(&max_bytes) { return Response::failure("max_bytes must be between 128 and 16000"); }
            let chunks = chunk_source(&content, max_bytes);
            Response::success(serde_json::json!({"language":language.unwrap_or_else(||"unknown".into()),"count":chunks.len(),"chunks":chunks}))
        }
        Request::Embed { text } => Response::success(serde_json::json!({"kind":"local_lexical_feature_vector","semantic":false,"dimensions":EMBEDDING_DIMENSIONS,"vector":lexical_embedding(&text)})),
        Request::Analyze { content, language } => {
            let tokens = tokenize(&content);
            let mut frequencies = BTreeMap::new();
            for token in &tokens { *frequencies.entry(token.clone()).or_insert(0usize) += 1; }
            let mut top: Vec<_> = frequencies.into_iter().collect();
            top.sort_by(|a,b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
            top.truncate(20);
            Response::success(serde_json::json!({"language":language.unwrap_or_else(||"unknown".into()),"bytes":content.len(),"lines":content.lines().count(),"token_count":tokens.len(),"top_tokens":top.into_iter().map(|(token,count)|serde_json::json!({"token":token,"count":count})).collect::<Vec<_>>()}))
        }
    }
}
pub fn chunk_source(source: &str, max_bytes: usize) -> Vec<String> {
    if source.is_empty() { return Vec::new(); }
    let mut chunks=Vec::new(); let mut current=String::new();
    for line in source.lines() {
        let piece=format!("{line}\\n");
        if !current.is_empty() && current.len()+piece.len()>max_bytes { chunks.push(current.trim_end_matches('\\n').to_string()); current.clear(); }
        if piece.len()>max_bytes {
            if !current.is_empty() { chunks.push(current.trim_end_matches('\\n').to_string()); current.clear(); }
            let mut start=0;
            while start<line.len() { let mut end=(start+max_bytes).min(line.len()); while !line.is_char_boundary(end) { end-=1; } chunks.push(line[start..end].to_string()); start=end; }
        } else { current.push_str(&piece); }
    }
    if !current.is_empty() { chunks.push(current.trim_end_matches('\\n').to_string()); }
    chunks
}
fn tokenize(text:&str)->Vec<String>{text.split(|c:char|!(c.is_alphanumeric()||c=='_'||c=='$')).filter(|s|s.chars().count()>=2).map(str::to_lowercase).collect()}
/// Deterministic lexical features only; this is not a semantic embedding model.
pub fn lexical_embedding(text:&str)->Vec<f32>{
    let mut vector=vec![0.0_f32;EMBEDDING_DIMENSIONS];
    for token in tokenize(text){let mut hash=2_166_136_261_u32;for byte in token.bytes(){hash^=u32::from(byte);hash=hash.wrapping_mul(16_777_619);}vector[(hash as usize)%EMBEDDING_DIMENSIONS]+=if hash>>31==0{1.0}else{-1.0};}
    let norm=vector.iter().map(|v|v*v).sum::<f32>().sqrt();if norm>0.0{for value in &mut vector{*value/=norm;}}vector
}
#[cfg(test)] mod tests { use super::*;
#[test] fn health_is_ready(){let r=handle(Request::Health);assert!(r.ok);assert_eq!(r.result.unwrap()["status"],"ready");}
#[test] fn chunks_respect_utf8_byte_boundaries(){let source="🦀".repeat(100);let chunks=chunk_source(&source,128);assert!(chunks.iter().all(|c|c.len()<=128));assert_eq!(chunks.concat(),source);}
#[test] fn vectors_are_deterministic_and_normalized(){let a=lexical_embedding("Brightdesk Rust engine");assert_eq!(a,lexical_embedding("Brightdesk Rust engine"));let n=a.iter().map(|v|v*v).sum::<f32>().sqrt();assert!((n-1.0).abs()<0.0001);}
#[test] fn empty_vector_is_zero(){assert!(lexical_embedding("").iter().all(|v|*v==0.0));}
#[test] fn invalid_chunk_limit_is_rejected(){let r=handle(Request::Chunk{content:"x".into(),language:None,max_bytes:1});assert!(!r.ok);}
}
