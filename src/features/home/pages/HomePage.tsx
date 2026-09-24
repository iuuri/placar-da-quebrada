export function HomePage() {
  return (
    <>
      <section className="py-10 sm:py-16">
        <h1 className="max-w-3xl font-display text-5xl font-black leading-[0.95] sm:text-7xl">
          Placar, tabela e cartões do campeonato da quebrada, ao vivo no celular.
        </h1>
        <p className="mt-5 max-w-prose text-lg text-tinta-suave">
          Quem está no campo lança o gol; quem está em casa vê na hora. A classificação se atualiza sozinha.
        </p>
      </section>

      <section aria-labelledby="campeonatos" className="border-t-2 border-tinta pt-6">
        <h2 id="campeonatos" className="font-display text-3xl font-bold">
          Campeonatos
        </h2>
        <p className="mt-3 text-tinta-suave">
          Nenhum campeonato publicado ainda. Quando o organizador publicar, os jogos aparecem aqui.
        </p>
      </section>
    </>
  )
}
