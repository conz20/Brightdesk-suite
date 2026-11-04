use napi_derive::napi;

#[napi(object)]
pub struct EngineInfo {
    pub name: String,
    pub version: String,
    pub core: String,
}

#[napi]
pub fn engine_info() -> EngineInfo {
    EngineInfo {
        name: "Brightdesk Native Engine".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        core: "brightdesk-core".to_string(),
    }
}
