# Research

## Observaciones de perfiles completos (recolección pública)

- [Resumen de 600 observaciones GraphQL](holistic-public-observations-summary.json): **561 perfiles devueltos**, 39 no devueltos; 402 READMEs de perfil observados, 469 cuentas con pins y 561 calendarios de contribución visibles para el lector. Ninguna insignia se verificó visualmente; **0 perfiles completos auditados**, **0 ganadores**.
- [Cola de 600 revisiones visuales](holistic-visual-review-queue.json) · [12 lotes de datos públicos autenticados](graphql-observations) · [extractos de 600 páginas como comprobación complementaria](partial-profiles). Los extractos tienen fechas de caché variables y no prueban actualidad.
- [Capturas fechadas de GitHub Trending Developers](trending-developers-snapshot.json): 25 usuarios por período (diario, semanal y mensual), **66 cuentas distintas**; las fechas de adquisición son dispares y no equivalen necesariamente al ranking de hoy.
- [Metodología de perfil completo](HOLISTIC_PROFILE_STUDY.md): avatar, cabecera, biografía, enlaces, README, pins, gráfico, achievements y contexto visual. Los estilos de la cola son hipótesis superpuestas, no categorías aprobadas.


- [600 unique candidate accounts, not yet fully audited](profile-candidates-600.json) · [complete-profile methodology, eight style categories and evidence gates](HOLISTIC_PROFILE_STUDY.md). Target: at least 500 fully reviewed profiles with avatar, sidebar, READMEs, pins, contribution graphs and visible achievements. The earlier 25 selection is a provisional README-only pilot, not category winners.

GH Aura uses versioned, **offline** structural references to inform profile presentation. Research is never collected in normal CLI use, and **no biography or README prose is copied**.

- [100 verified public profile README examples](PROFILE_REFERENCES.md) · [structured reference bank](profile-design-references.json) (8 user supplied + 4 earlier + 88 newly checked; **all pending approval**, no copied assets).
- [Primary reference: 200 ordinary-visibility engineer profiles](ORDINARY_STUDY.md) · [structured data](ordinary-engineers-200.json).
- [Historical professional affiliation baseline (100) and employer-source examples (16)](INDUSTRY_STUDY.md) · [100-account dataset](company-profiles.json) · [16-account observations](employer-observations.json) · [source roster](employer-sourced.json).

Company membership and self-described roles are public affiliation signals, **not independent confirmation of employment**. The research did not measure interview outcomes.

The initial contributor-to-popular-projects baseline (not an employment cohort) was removed from the current tree during cleanup. Its history remains available through older Git tags and commits; old downloadable releases are intentionally pruned.

The developer-only collector scripts live in `scripts/research-*.mjs`. They must be run intentionally with a GitHub read token and bounded quotas; the installed CLI does not include them or run them in the background.
