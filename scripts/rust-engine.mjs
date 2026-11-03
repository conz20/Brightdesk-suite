import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const executable=process.platform==="win32"?path.join(root,"rust","target","release","brightdesk-engine.exe"):path.join(root,"rust","target","release","brightdesk-engine");
export async function isRustEngineBuilt(){try{await access(executable);return true;}catch{return false;}}
export async function runRustEngine(request,{timeoutMs=10000}={}){
 if(!request||typeof request!=="object"||typeof request.op!=="string")throw new TypeError("A Rust engine request with an operation is required.");
 if(!(await isRustEngineBuilt())){const error=new Error("Brightdesk Rust engine is not built. Run npm run rust:build.");error.code="RUST_ENGINE_NOT_BUILT";throw error;}
 return new Promise((resolve,reject)=>{const child=spawn(executable,[],{cwd:root,stdio:["pipe","pipe","pipe"],windowsHide:true});let stdout="",stderr="",settled=false;
 const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(value);};
 const timer=setTimeout(()=>{child.kill();finish(new Error("Brightdesk Rust engine request timed out."));},timeoutMs);
 child.stdout.setEncoding("utf8");child.stderr.setEncoding("utf8");child.stdout.on("data",chunk=>{stdout+=chunk;});child.stderr.on("data",chunk=>{stderr+=chunk;});child.on("error",error=>finish(error));
 child.on("close",code=>{if(code!==0)return finish(new Error(stderr.trim()||`Rust engine exited with code ${code}.`));try{const response=JSON.parse(stdout.trim());if(!response.ok)return finish(new Error(response.error||"Rust engine rejected the request."));finish(null,response);}catch{finish(new Error("Rust engine returned invalid JSON."));}});
 child.stdin.end(JSON.stringify(request)+"\\n");});
}
