FROM --platform=linux/amd64 electronuserland/builder:24-wine-chrome@sha256:4a77093fdf84f1d635fc31f7310db8221b964968b9544364423a65e34c47443e

USER root
ARG NODE_VERSION=24.22.2
ARG RUST_VERSION=1.99.1
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl xz-utils gcc-mingw-w64-x86-64 libfuse2 \
 && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
 curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" -o /tmp/node-shasums.txt; \
 curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz; \
 grep " node-v${NODE_VERSION}-linux-x64.tar.xz$" /tmp/node-shasums.txt | sha256sum -c -; \
 tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1; \
 rm -f /tmp/node.tar.xz /tmp/node-shasums.txt; \
 test "$(node --version)" = "v${NODE_VERSION}"

ENV PATH="/root/.cargo/bin:/usr/local/bin:${PATH}"
ENV CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc
ENV CARGO_TARGET_X86_64_PC_WINDOWS_GNU_RUSTFLAGS="-C target-feature=+crt-static -C link-arg=-static-libgcc"

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain "${RUST_VERSION}" --component rustfmt --component clippy --target x86_64-pc-windows-gnu
RUN rustc --version && cargo --version && x86_64-w64-mingw32-gcc --version && wine --version && xvfb-run --help >/dev/null
WORKDIR /workspace
