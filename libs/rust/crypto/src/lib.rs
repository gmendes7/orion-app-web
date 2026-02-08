// libs/rust/crypto/src/lib.rs
// Exemplo simples de funcoes de encriptacao AEAD com `ring`.

use ring::aead;

pub fn seal_in_place(
    key_bytes: &[u8; 32],
    nonce_bytes: &[u8; 12],
    plaintext: &mut Vec<u8>,
) -> Result<Vec<u8>, String> {
    let unbound =
        aead::UnboundKey::new(&aead::AES_256_GCM, key_bytes).map_err(|e| {
            format!("unbound: {:?}", e)
        })?;
    let less_safe = aead::LessSafeKey::new(unbound);
    let nonce = aead::Nonce::assume_unique_for_key(*arrayref::array_ref!(
        nonce_bytes, 0, 12
    ));
    less_safe
        .seal_in_place_append_tag(nonce, aead::Aad::empty(), plaintext)
        .map_err(|e| format!("seal: {:?}", e))?;
    Ok(plaintext.clone())
}

pub fn open_in_place(
    key_bytes: &[u8; 32],
    nonce_bytes: &[u8; 12],
    ciphertext: &mut [u8],
) -> Result<Vec<u8>, String> {
    let unbound =
        aead::UnboundKey::new(&aead::AES_256_GCM, key_bytes).map_err(|e| {
            format!("unbound: {:?}", e)
        })?;
    let less_safe = aead::LessSafeKey::new(unbound);
    let nonce = aead::Nonce::assume_unique_for_key(*arrayref::array_ref!(
        nonce_bytes, 0, 12
    ));
    let plain = less_safe
        .open_in_place(nonce, aead::Aad::empty(), ciphertext)
        .map_err(|e| format!("open: {:?}", e))?;
    Ok(plain.to_vec())
}

// Observacao: este exemplo depende de crates `ring` e `arrayref` no Cargo.toml do crate.
