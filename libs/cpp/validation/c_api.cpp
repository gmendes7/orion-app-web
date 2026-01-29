#include "c_api.h"
#include <string>
#include "verify.h"

int verify_signature_c(const char *message, const char *sig_base64, const char *pubkey_base64)
{
  std::string msg(message ? message : "");
  std::string sig(sig_base64 ? sig_base64 : "");
  std::string pub(pubkey_base64 ? pubkey_base64 : "");
  return verify_signature(msg, sig, pub) ? 1 : 0;
}
