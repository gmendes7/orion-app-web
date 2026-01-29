#include <iostream>
#include <string>
#include "c_api.h"

int main(int argc, char **argv)
{
  if (argc < 4)
  {
    std::cerr << "usage: verify_cli <message> <signature_base64> <pubkey_base64>\n";
    return 2;
  }
  const char *msg = argv[1];
  const char *sig = argv[2];
  const char *pub = argv[3];
  int ok = verify_signature_c(msg, sig, pub);
  std::cout << (ok ? "valid" : "invalid") << std::endl;
  return ok ? 0 : 1;
}
