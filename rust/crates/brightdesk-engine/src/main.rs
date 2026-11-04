use std::io::{self, BufRead, Write};
use brightdesk_engine::{handle, Request};
fn main() {
    let stdin=io::stdin(); let stdout=io::stdout(); let mut output=stdout.lock();
    for line in stdin.lock().lines() {
        let response=match line { Ok(line) if line.trim().is_empty()=>continue, Ok(line)=>match serde_json::from_str::<Request>(&line){Ok(req)=>handle(req),Err(err)=>{eprintln!("Invalid Brightdesk engine request: {err}");continue;}}, Err(err)=>{eprintln!("Brightdesk engine input error: {err}");break;} };
        if serde_json::to_writer(&mut output,&response).is_err(){break;} if writeln!(output).is_err()||output.flush().is_err(){break;}
    }
}
