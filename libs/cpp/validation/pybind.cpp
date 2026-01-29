#ifdef BUILD_PYBIND11
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

#include "c_api.h"

namespace py = pybind11;

PYBIND11_MODULE(pyvalidate, m)
{
  m.doc() = "Validation bindings for ORION";
  m.def("verify", [](const std::string &message, const std::string &sig_b64, const std::string &pub_b64)
        { return verify_signature_c(message.c_str(), sig_b64.c_str(), pub_b64.c_str()) == 1; }, "Verify a base64 signature");
}
#endif
