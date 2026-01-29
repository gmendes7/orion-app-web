#pragma once

#include <string>

// Verifies a base64 signature using libsodium. Returns true when signature is valid.
bool verify_signature(const std::string &message, const std::string &sig_base64, const std::string &pubkey_base64);
