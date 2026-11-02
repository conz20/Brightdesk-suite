# Wine 10.4 is kept intentionally for x64-on-ARM Docker builds.
# Wine 10.5+ can abort under Rosetta/QEMU with ntdll anon_mmap_fixed host_page_mask.
# See Wine bug 58084: https://bugs.winehq.org/show_bug.cgi?id=58084
FROM scottyhardy/docker-wine:devel-10.4

USER root

ARG NODE_VERSION=24.22.2
ARG NODE_ARCHIVE_SHA256=361718c444e49af2ca5a110c83ba6a8901143f23ab285ebbef0341f391f482a9

RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl xz-utils; \
    rm -rf /var/lib/apt/lists/*; \
    archive="node-v${NODE_VERSION}-linux-x64.tar.gz"; \
    curl --fail --location --silent --show-error "https://nodejs.org/dist/v${NODE_VERSION}/${archive}" -o "/tmp/${archive}"; \
    echo "${NODE_ARCHIVE_SHA256}  /tmp/${archive}" | sha256sum --check --status; \
    tar --extract --gzip --file="/tmp/${archive}" --directory=/opt; \
    rm "/tmp/${archive}"; \
    test "$(PATH="/opt/node-v${NODE_VERSION}-linux-x64/bin:$PATH" node --version)" = "v${NODE_VERSION}"; \
    test "$(wine --version)" = "wine-10.4"

ENV PATH="/opt/node-v24.22.2-linux-x64/bin:${PATH}"

RUN node --version && wine --version
