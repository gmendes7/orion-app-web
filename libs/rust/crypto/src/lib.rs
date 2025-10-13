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