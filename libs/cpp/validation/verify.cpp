// libs/cpp/validation/verify.cpp
#if defined(__has_include)
#if __has_include(<sodium.h>)
#include <sodium.h>
#elif __has_include(<sodium/sodium.h>)
#include <sodium/sodium.h>
#else
#error "libsodium header not found; install libsodium and add its include dir to your compiler includePath"
#endif
#else
#include <sodium.h>
#endif
#include <string>
#include <vector>

bool verify_signature(const std::string &message, const std::string &sig_base64, const std::string &pubkey_base64)
{
  if (sodium_init() < 0)
    return false;

  // decode base64
  std::vector<unsigned char> sig(crypto_sign_BYTES);
  std::vector<unsigned char> pub(crypto_sign_PUBLICKEYBYTES);

  if (sodium_base642bin(sig.data(), sig.size(), sig_base64.c_str(), sig_base64.size(), NULL, NULL, NULL, sodium_base64_VARIANT_ORIGINAL) != 0)
    return false;
  if (sodium_base642bin(pub.data(), pub.size(), pubkey_base64.c_str(), pubkey_base64.size(), NULL, NULL, NULL, sodium_base64_VARIANT_ORIGINAL) != 0)
    return false;

  int ok = crypto_sign_verify_detached(sig.data(), (const unsigned char *)message.data(), message.size(), pub.data());
  return ok == 0;
}

// Small demo main for manual testing
#ifdef DEMO
#include <iostream>
int main()
{
  std::string message = "hello";
  std::string sig, pub; // fill with base64 values
  std::cout << "verify: " << verify_signature(message, sig, pub) << std::endl;
}
#endif
