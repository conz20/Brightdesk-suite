# Brightdesk AI model notices

These components are downloaded only by the GitHub Actions maintenance helper. They are not bundled into the Brightdesk customer installers.

## Qwen3 0.6B

- Project: Qwen3 by Qwen Team.
- Repository: https://github.com/QwenLM/Qwen3
- Model source: https://huggingface.co/Qwen/Qwen3-0.6B-GGUF
- Licence: Apache License 2.0.
- Pinned Hugging Face revision: 23749fefcc72300e3a2ad315e1317431b06b590a.
- Model file: Qwen3-0.6B-Q8_0.gguf.
- SHA-256: 9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031.

## llama.cpp

- Project: llama.cpp by ggml-org.
- Repository: https://github.com/ggml-org/llama.cpp
- Pinned release: b10343.
- Licence: MIT.
- Linux x64 archive: llama-b10343-bin-ubuntu-x64.tar.gz.
- SHA-256: 12d6403e0e1af83e0d4cdf77b54c9eeb776a3bbabd9fb591a12db22dbfd88872.

The helper verifies both checksums before running either downloaded component. Check the upstream project licences and notices when changing either pinned version.

These third-party components are used only for local inference on the ephemeral GitHub Actions runner. They do not receive a paid API key. Their licence and provenance do not imply that the model's answers are accurate or safe to apply without verification.
