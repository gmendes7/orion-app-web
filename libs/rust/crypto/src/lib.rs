<<<<<<< HEAD
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
// Simple crypto helpers: AES-256-GCM encrypt/decrypt using `aes-gcm` and `rand` crates.

use aes_gcm::{Aes256Gcm, Key, Nonce}; // 96-bits nonce
use aes_gcm::aead::{Aead, NewAead};
use rand::rngs::OsRng;
use rand::RngCore;

/// Encrypt plaintext with AES-256-GCM. Returns (nonce, ciphertext).
pub fn encrypt_aes256_gcm(key_bytes: &[u8;32], plaintext: &[u8], aad: Option<&[u8]>) -> Result<(Vec<u8>, Vec<u8>), String> {
    let key = Key::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher.encrypt(nonce, 
        aead::Payload { msg: plaintext, aad: aad.unwrap_or(&[]) })
        .map_err(|e| format!("encrypt error: {:?}", e))?;
    Ok((nonce_bytes.to_vec(), ciphertext))
}

/// Decrypt with AES-256-GCM
pub fn decrypt_aes256_gcm(key_bytes: &[u8;32], nonce_bytes: &[u8], ciphertext: &[u8], aad: Option<&[u8]>) -> Result<Vec<u8>, String> {
    let key = Key::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);
    let plaintext = cipher.decrypt(nonce, 
        aead::Payload { msg: ciphertext, aad: aad.unwrap_or(&[]) })
        .map_err(|e| format!("decrypt error: {:?}", e))?;
    Ok(plaintext)
}
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> 534f3205cfe376ada3b5e8bd024e7a9dfb63c30e
// libs/rust/crypto/src/lib.rs
// Exemplo simples de funções de encriptação AEAD com `ring`.

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

// Observação: este exemplo depende de crates `ring` e `arrayref` no Cargo.toml do crate.
<<<<<<< HEAD
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> 534f3205cfe376ada3b5e8bd024e7a9dfb63c30e
