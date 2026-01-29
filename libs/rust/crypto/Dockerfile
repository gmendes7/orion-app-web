# libs/rust/crypto/Dockerfile
FROM rust:1.72-slim
WORKDIR /usr/src/crypto
COPY libs/rust/crypto/Cargo.toml ./
# copy src
COPY libs/rust/crypto/src ./src
RUN cargo build --release
CMD ["/usr/src/crypto/target/release/crypto"]
