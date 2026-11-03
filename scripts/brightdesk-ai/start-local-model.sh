#!/usr/bin/env bash
set -euo pipefail

CACHE_DIR="${BRIGHTDESK_AI_CACHE_DIR:-$HOME/.cache/brightdesk-ai}"
WORK_DIR="$CACHE_DIR/downloads"
LLAMA_VERSION="${LLAMA_VERSION}"
LLAMA_ARCHIVE="llama-${LLAMA_VERSION}-bin-ubuntu-x64.tar.gz"
LLAMA_SHA256="12d6403e0e1af83e0d4cdf77b54c9eeb776a3bbabd9fb591a12db22dbfd88872"
LLAMA_URL="https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_VERSION}/${LLAMA_ARCHIVE}"
MODEL_NAME="Qwen3-0.6B-Q8_0.gguf"
MODEL_SHA256="9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031"
MODEL_URL="https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/23749fefcc72300e3a2ad315e1317431b06b590a/${MODEL_NAME}"

mkdir -p "$CACHE_DIR" "$WORK_DIR"

EXTRACT_DIR="$WORK_DIR/llama-${LLAMA_VERSION}"
ARCHIVE_PATH="$WORK_DIR/$LLAMA_ARCHIVE"
MODEL_FILE="$CACHE_DIR/$MODEL_NAME"

if [[ ! -d "$EXTRACT_DIR" ]] || ! find "$EXTRACT_DIR" -type f -name llama-server -print -quit | grep -q .; then
  curl --fail --location --retry 3 --retry-delay 2 "$LLAMA_URL" --output "$ARCHIVE_PATH"
  printf '%s  %s\n' "$LLAMA_SHA256" "$ARCHIVE_PATH" | sha256sum --check --status
  rm -rf "$EXTRACT_DIR"
  mkdir -p "$EXTRACT_DIR"
  tar -xzf "$ARCHIVE_PATH" -C "$EXTRACT_DIR"
fi

LLAMA_SERVER="$(find "$EXTRACT_DIR" -type f -name llama-server -print -quit)"
if [[ -z "$LLAMA_SERVER" || ! -x "$LLAMA_SERVER" ]]; then
  echo "The verified llama.cpp archive did not contain an executable llama-server." >&2
  exit 1
fi

if [[ ! -f "$MODEL_FILE" ]]; then
  curl --fail --location --retry 3 --retry-delay 2 "$MODEL_URL" --output "$MODEL_FILE"
fi
printf '%s  %s\n' "$MODEL_SHA256" "$MODEL_FILE" | sha256sum --check --status

if [[ -f "$CACHE_DIR/server.pid" ]]; then
  old_pid="$(cat "$CACHE_DIR/server.pid")"
  if [[ "$old_pid" =~ ^[0-9]+$ ]] && kill -0 "$old_pid" 2>/dev/null &&
    ps -p "$old_pid" -o args= | grep -q '[l]lama-server'; then
    echo "Brightdesk local AI model server is already running."
    exit 0
  fi
  rm -f "$CACHE_DIR/server.pid"
fi

"$LLAMA_SERVER" \
  --model "$MODEL_FILE" \
  --host 127.0.0.1 \
  --port 8080 \
  --ctx-size 4096 \
  --threads 2 \
  --n-gpu-layers 0 \
  > "$CACHE_DIR/server.log" 2>&1 &
echo "$!" > "$CACHE_DIR/server.pid"

for attempt in $(seq 1 60); do
  if curl --silent --fail http://127.0.0.1:8080/health >/dev/null; then
    echo "Brightdesk local AI model is ready."
    exit 0
  fi
  sleep 2
done

echo "The local AI model did not become ready. Recent server output:" >&2
tail -n 60 "$CACHE_DIR/server.log" >&2 || true
exit 1
