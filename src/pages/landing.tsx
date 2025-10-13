export default function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#120018] to-[#060006] text-white">
      <section className="max-w-4xl mx-auto py-24 px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-purple-500">
          O.R.I.O.N.X
        </h1>
        <p className="mt-4 text-lg">
          Uma inteligência artificial criada por Gabriel Mendes Lourenço (18
          anos, UNIDERP). Desenvolvida com React, TypeScript, Supabase, Azure
          Cognitive Services e N8N.
        </p>
        <p className="mt-6">
          O.R.I.O.N.X interpreta imagens, automatiza tarefas e aprende com cada
          interação — com privacidade e LGPD desde o início.
        </p>
        <a
          href="/auth/login"
          className="inline-block mt-8 px-6 py-3 bg-violet-600 rounded-lg"
        >
          Entrar na O.R.I.O.N.X
        </a>
      </section>
    </main>
  );
}
