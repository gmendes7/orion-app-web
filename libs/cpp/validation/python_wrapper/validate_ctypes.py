"""ctypes wrapper to load the compiled C shared library (validate_c) and expose a simple Python API.

Usage:
    from libs.cpp.validation.python_wrapper.validate_ctypes import verify_signature
    ok = verify_signature("message", "sig_base64", "pub_base64")
"""
from __future__ import annotations
import ctypes
import os
from typing import Optional


def _find_lib() -> Optional[str]:
    # common build locations
    candidates = [
        os.path.join(os.path.dirname(__file__), '..', '..', 'validation', 'build', 'libvalidate_c.so'),
        os.path.join(os.path.dirname(__file__), '..', '..', 'validation', 'build', 'libvalidate_c.dylib'),
        os.path.join(os.path.dirname(__file__), '..', '..', 'validation', 'build', 'validate_c.dll'),
    ]
    for p in candidates:
        p = os.path.abspath(p)
        if os.path.exists(p):
            return p
    # allow overriding via env
    env = os.environ.get('VALIDATE_C_LIB')
    if env and os.path.exists(env):
        return env
    return None


_LIB_PATH = _find_lib()
_LIB = None
if _LIB_PATH:
    try:
        _LIB = ctypes.CDLL(_LIB_PATH)
    except Exception:
        _LIB = None


def verify_signature(message: str, sig_base64: str, pubkey_base64: str) -> bool:
    """Verify signature using the native library. Returns True if valid."""
    if not _LIB:
        raise RuntimeError("validate_c library not found. Build the C++ lib first or set VALIDATE_C_LIB env")

    _LIB.verify_signature_c.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p]
    _LIB.verify_signature_c.restype = ctypes.c_int

    res = _LIB.verify_signature_c(message.encode('utf-8'), sig_base64.encode('utf-8'), pubkey_base64.encode('utf-8'))
    return bool(res == 1)
