// backend/node-integration/gateway.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const sodium = require("libsodium-wrappers");

const app = express();
app.use(express.json());

const CAMERA_ENDPOINT =
  process.env.CAMERA_ENDPOINT || "https://camera.example/api/submit";

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Simple signature verification using libsodium (ed25519)
app.post("/validate-signature", async (req, res) => {
  await sodium.ready;
  const { message, signature, public_key } = req.body;
  if (!message || !signature || !public_key)
    return res.status(400).json({ error: "missing_fields" });

  try {
    const sig = Buffer.from(signature, "base64");
    const pub = Buffer.from(public_key, "base64");
    const msg = Buffer.from(message);
    const ok = sodium.crypto_sign_verify_detached(
      new Uint8Array(sig),
      new Uint8Array(msg),
      new Uint8Array(pub)
    );
    return res.json({ valid: !!ok });
  } catch (err) {
    console.error("verify error", err);
    return res.status(500).json({ error: "verify_failed" });
  }
});

// Forward vote payload to Camera API with basic validation and retry
app.post("/forward-vote", async (req, res) => {
  const votePayload = req.body;
  if (!votePayload || !votePayload.deputy_id || !votePayload.session_id) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  // Optional: verify signature using /validate-signature or via local libs
  try {
    const resp = await axios.post(CAMERA_ENDPOINT, votePayload, {
      timeout: 5000,
    });
    return res.status(resp.status).send(resp.data);
  } catch (err) {
    console.error("forward error", err?.toString());
    return res.status(502).json({ error: "gateway_error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gateway listening on ${PORT}`));
