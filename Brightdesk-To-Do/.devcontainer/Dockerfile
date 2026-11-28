FROM node:24.22.3-bookworm

WORKDIR /workspaces/brightdesk-suite

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2 \
    && rm -rf /var/lib/apt/lists/*

CMD ["bash"]
