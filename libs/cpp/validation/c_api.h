#pragma once

#ifdef __cplusplus
extern "C"
{
#endif

  int verify_signature_c(const char *message, const char *sig_base64, const char *pubkey_base64);

#ifdef __cplusplus
}
#endif
