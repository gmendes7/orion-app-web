import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import express from "express";

const app = express();
const credential = new DefaultAzureCredential();
const keyVaultUrl = process.env.KEYVAULT_URL || "";
if (!keyVaultUrl) {
  console.error("KEYVAULT_URL not set");
  process.exit(1);
}
const client = new SecretClient(keyVaultUrl, credential);

app.get("/secret/:name", async (req, res) => {
  const name = req.params.name;
  try {
    const secret = await client.getSecret(name);
    // nunca retornar o valor real em produção via API pública
    res.json({
      name: secret.name,
      value: secret.value ? "***redacted***" : null,
    });
  } catch (err) {
    console.error("keyvault read error", err);
    res.status(500).json({ error: "failed to read secret" });
  }
});

export default app;
