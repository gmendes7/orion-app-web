# libs/cpp/validation/Dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y build-essential cmake libsodium-dev git && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY . .
RUN cmake -S . -B build && cmake --build build -- -j$(nproc)
CMD ["/src/build/verify"]
