import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProfileEditor({
  user,
  onSave,
}: {
  user: any;
  onSave: (u: any) => void;
}) {
  const [username, setUsername] = useState(user?.username ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      let avatarUrl: string | null = user?.avatar_url ?? null;

      // upload avatar to Supabase Storage if provided
      if (file && user?.id) {
        const path = `avatars/${user.id}/avatar-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          console.error("upload error", uploadError);
          throw new Error("Falha no upload do avatar");
        }

        // get public URL (requires bucket public) or use createSignedUrl for private buckets
        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatarUrl = publicData.publicUrl || null;
      }

      // update profile row (RLS should allow user to update own row)
      if (user?.id) {
        const payload = {
          id: user.id,
          username,
          avatar_url: avatarUrl,
        };
        const { error: dbError, data: updated } = await supabase
          .from("profiles")
          .upsert(payload, { returning: "representation" });

        if (dbError) {
          console.error("db update error", dbError);
          throw new Error("Falha ao atualizar perfil");
        }

        // call onSave with updated profile (use updated[0] when upsert returns array)
        const newProfile = Array.isArray(updated) ? updated[0] : updated;
        onSave(newProfile ?? { ...user, username, avatar_url: avatarUrl });
      } else {
        console.error("profile save failed", await resp.text());
      }
    } catch (err) {
      console.error("profile save failed", err);
      // opcional: exibir notificação ao usuário
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-gradient-to-br from-[#1b0b2b] to-black rounded-lg text-white">
      <label className="block mb-2">Nome de usuário</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full p-2 rounded bg-[#0f0b12] text-white"
      />
      <label className="block mt-4 mb-2">Avatar</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-violet-600 rounded"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
