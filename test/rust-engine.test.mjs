import test from "node:test";
import assert from "node:assert/strict";
import { isRustEngineBuilt, runRustEngine } from "../scripts/rust-engine.mjs";
test("Rust bridge rejects malformed requests",async()=>{await assert.rejects(runRustEngine(null),TypeError);await assert.rejects(runRustEngine({}),TypeError);});
test("Rust bridge reports a missing build without breaking JavaScript fallback",async()=>{if(!(await isRustEngineBuilt()))await assert.rejects(runRustEngine({op:"health"}),error=>error.code==="RUST_ENGINE_NOT_BUILT");});
test("Rust bridge health-checks a compiled engine",async()=>{if(await isRustEngineBuilt()){const response=await runRustEngine({op:"health"});assert.equal(response.ok,true);assert.equal(response.result.status,"ready");}});
