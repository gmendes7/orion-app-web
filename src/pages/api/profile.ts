import busboy from "busboy";
import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { getServerSession } from "../../lib/auth"; // implementar guard apropriado
import { uploadToBlob } from "../../lib/blob";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "POST") return res.status(405).end();

  const bb = busboy({ headers: req.headers as any });
  let username = "";
  let avatarBuffer: Buffer | undefined;

  bb.on("file", (_name, file) => {
    const chunks: Buffer[] = [];
    file.on("data", (c) => chunks.push(c));
    file.on("end", () => {
      avatarBuffer = Buffer.concat(chunks);
    });
  });

  bb.on("field", (name, val) => {
    if (name === "username") username = val;
  });

  bb.on("close", async () => {
    try {
      let avatarUrl;
      if (avatarBuffer) {
        const compressed = await sharp(avatarBuffer)
          .resize(512, 512, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer();
        avatarUrl = await uploadToBlob(
          compressed,
          `avatars/${session.user.id}-${Date.now()}.jpg`
        );
      }
      // atualizar DB com credenciais server-side (não expor service key)
      // await updateProfileInDb(session.user.id, { username, avatar_url: avatarUrl });
      return res.json({ username, avatar: avatarUrl });
    } catch (err) {
      console.error("profile api error", err);
      return res.status(500).json({ error: "failed" });
    }
  });

  req.pipe(bb);
}
