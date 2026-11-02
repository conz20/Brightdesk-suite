FROM electronuserland/builder:wine@sha256:f3a8d451994c881d0972e7b1846ee4d4fdc15eb41fc6b1f350b38cbf99ca90fe

USER root

ARG NODE_VERSION=24.22.2
ARG NODE_ARCHIVE_SHA256=361718c444e49af2ca5a110c83ba6a8901143f23ab285ebbef0341f391f482a9

RUN set -eux; \
    archive="node-v${NODE_VERSION}-linux-x64.tar.gz"; \
    curl --fail --location --silent --show-error "https://nodejs.org/dist/v${NODE_VERSION}/${archive}" -o "/tmp/${archive}"; \
    echo "${NODE_ARCHIVE_SHA256}  /tmp/${archive}" | sha256sum --check --status; \
    tar --extract --gzip --file="/tmp/${archive}" --directory=/opt; \
    rm "/tmp/${archive}"; \
    test "$(PATH="/opt/node-v${NODE_VERSION}-linux-x64/bin:$PATH" node --version)" = "v${NODE_VERSION}"

ENV PATH="/opt/node-v24.22.2-linux-x64/bin:${PATH}"

RUN node --version && wine --version
