# Investigación GH Aura: perfiles completos, no solo README

**Estado (12 de noviembre de 2026):** 600 **candidatos únicos descubiertos**, NO 600 perfiles examinados ni categorizados. Objetivo: al menos 500 perfiles completos verificables, con exploración y reposición de candidatos inaccesibles. No publicar conclusiones sobre los mejores hasta cerrar la evaluación de sus componentes.

## Qué constituye un perfil

Cada ficha representa lo que un visitante real puede ver en la página de perfil de GitHub:

1. **Identidad visual:** avatar, composición visual de la cabecera y coherencia con el resto del perfil; la URL del avatar no basta para evaluar su estilo.
2. **Información lateral:** nombre visible, biografía, campo de compañía autodeclarado, status, enlaces de contacto y webs públicos (sin retener datos sensibles o texto personal en el corpus).
3. **README del perfil:** presencia o ausencia, longitud, jerarquía, estructura, contenido técnico, imágenes, SVG/GIF, enlaces, accesibilidad y diseño claro/oscuro.
4. **Repositorios/gists pineados:** número, orden, enlaces, descripción, pertinencia y prueba del trabajo. No equiparar popularidad con calidad.
5. **Mapa de contribuciones:** actividad visible y distribución visual, con matices sobre cuentas privadas, fechas y atribución. Nunca interpretar cuadrados verdes como nivel técnico o prueba laboral.
6. **Achievements/highlights:** los que se ven de forma comprobable, su pertinencia visual y sus límites de visibilidad; no asignar insignias o niveles por inferencia.
7. **Conjunto:** cómo interactúan todas las partes, qué cuenta del trabajo real y qué entiende alguien en la primera visita.

**Ausente, no observado, restringido y no accesible son estados diferentes.** Una imagen o contador no verificado no equivale a un atributo negativo. La presencia de un README nunca es requisito para incluir un perfil.

## Fuentes y descubrimiento

El archivo [profile-candidates-600.json](profile-candidates-600.json) une 285 cuentas distintas de cuatro registros previos (100 READMEs, 200 perfiles de ingenieros, cohorte histórica de 100 y 16 fuentes empresariales, con superposición) y 315 handles **únicamente listados** en el archivo histórico de [EddieHub Community](https://github.com/EddieHubCommunity/awesome-github-profiles/blob/main/profiles.md). El repositorio de EddieHub fue archivado en 2024; no constituye verificación actual.

GitHub Trending Developers (diario, semanal y mensual) es un **canal adicional de descubrimiento**, no de aprobación editorial. La página mensual no pudo verificarse directamente en este entorno; no hay rangos de Trending atribuidos a ningún candidato. No depender de una única galería ni solo de personas populares: mantener variedad de trayectorias, tamaño de audiencia, roles y necesidades.

## Etapas para las 500 fichas

**A. Descubrimiento:** deduplicación insensible a mayúsculas, fuente exacta, fecha, sin implicar que el perfil existe hoy. 600 candidatos dan margen para reemplazar enlaces rotos.

**B. Observación de datos públicos:** ejecutar explícitamente el colector de investigación con credenciales locales de lectura, límites de tamaño/solicitudes y sin datos privados. Guardar resumen del README, avatar URL sin copia de imagen, presencia de bio/enlaces, metadatos de pins y calendario visible. Si falta un dato, indicar motivo; no completar con predicciones. Capturar Git blob y fecha para evitar usar datos obsoletos.

**C. Auditoría visual completa:** revisar la página real, avatar, README renderizado, repositorios pineados, gráfico, achievements, biografía y enlaces en escritorio y móvil, temas claro y oscuro cuando aplique. Se hace mediante visita real o captura con permisos, con fecha y comprobación de recursos externos; no se confunde el análisis del Markdown con una auditoría visual. Los casos de contenido privado no revelan datos de repos privados.

**D. Taxonomía multidimensional:** definir **un estilo predominante** y etiquetas secundarias, no un objetivo laboral obligatorio. Estilos:
- `native-no-readme`: la identidad y selección de pins cargan la presentación.
- `minimal-text`: breve, clara, mínima ornamentación.
- `technical-editorial`: explicación técnica detallada, pruebas y enlaces.
- `project-showcase`: portafolio de proyectos/productos, capturas con función demostrativa.
- `visual-illustrated`: imagen, marca o ilustración original coherente.
- `terminal-code`: bloques de código, ASCII y estética de herramientas.
- `data-dashboard`: métricas y diagramas dominantes, revisados críticamente.
- `dynamic-content`: material mantenido automáticamente, solo si aporta información.

Por separado anotar **propósito** (`career`, `research`, `open-source`, `product`, `personal`, `educational`), densidad, imagen, biografía, pins, gráfico, achievements, accesibilidad y mantenimiento. Un perfil puede combinar visual/terminal, editorial/portafolio, etc. Si no hay datos suficientes, `unclassified` es la única clasificación responsable.

**E. Comparación dentro de cada estilo:** evaluación editorial con evidencias trazables de claridad, coherencia del conjunto, valor de pins, especificidad del trabajo, originalidad, legibilidad, accesibilidad, derechos y mantenimiento. No premiar más badges, más palabras, más estrellas, más commits ni más gráficos. No equiparar ausencia de un README con fracaso si los otros componentes comunican bien. Registrar ejemplos de contraste, incertidumbres y desacuerdos de revisores.

**F. Selección por categoría:** no fijar 25 perfiles ni cuotas antes de la evaluación. Mantener los mejores ejemplos distintos por estilo y propósito, con al menos dos personas que revisen casos dudosos cuando sea posible. Desempatar por señal útil original y no por fama. Los diseños finales son **patrones de composición**, no personas, copias de texto ni activos de terceros.

## Regla de aprobación

La lista anterior de 25 (PR #67) fue un **piloto de READMEs**, no un veredicto de perfiles completos. No debe condicionar automáticamente los briefs ni presentarse como la lista definitiva. Mantener sus enlaces como casos provisionales hasta contrastarlos contra el corpus integral.

**No apto para conclusión**: muestra de candidatos sin verificar, una sola dimensión del perfil, información de achievements inferida, usuarios famosos como sustitutos de calidad o evaluación sin renderizado real.

## Automatización y privacidad

El recolector es solo de desarrollo; no se ejecuta en el CLI normal ni en MCP, no escribe en cuentas GitHub, no descargas imágenes, no almacena emails, bios completas ni ubicaciones. GitHub puede mostrar contribuciones privadas anonimizadas; nunca afirmar que se conoce la actividad privada ni que GitHub concedió una insignia.

La generación de perfiles de GH Aura funciona sin IA y puede mejorarse con IA opcional. **No se necesita GitHub Pages.** El registro de 600 candidatos es el inicio de la auditoría, no su finalización.

## Ejecución reproducible (opt-in, en terminal propia)

El CLI normal no ejecuta estas tareas. El token de solo lectura se configura localmente, nunca se añade al JSON ni se envía a una IA. Los registros de 600 candidatos no cuentan como 600 perfiles analizados.

```bash
# Revisar el primer grupo de 50 candidatos con 10 peticiones GraphQL acotadas:
GH_TOKEN=... node scripts/research-holistic-profiles.mjs \
  --start 0 --limit 50 --batch-size 5 --budget 10 \
  --output research/holistic-batch-000.json

# Repetir con starts 50, 100, 150, ... (sin sobrescribir archivos).
# Unificar las fichas de API y crear una cola editable para inspección visual:
node scripts/merge-holistic-batches.mjs \
  --output research/holistic-observed.json \
  --reviews research/holistic-review-queue.json \
  research/holistic-batch-*.json

# Solo tras revisar manualmente los componentes y completar >=500 fichas:
node scripts/select-holistic-exemplars.mjs \
  --reviews research/holistic-reviewed.json \
  --output research/holistic-category-exemplars.json
```

`holistic-review-queue.json` es una plantilla **sin clasificar**, no un estudio acabado. Completar estado de cada componente, capturas/URL fechadas, comprobación desktop/móvil/claro/oscuro, estilo principal y secundarios, propósitos, notas y decisión editorial. Marcar `privacy-hidden` cuando una sección sea legítimamente privada; nunca asumir que su contenido está vacío. Si una categoría no tiene suficientes ejemplos completos, ampliar descubrimiento antes de proclamar un ganador. La selección no define un número fijo de ganadores globales.

**Limite externo actual:** la credencial de investigación de GitHub no está disponible como token en esta conversación, y la inspección visual completa de 500 cuentas no ha sido realizada. Los scripts quedan preparados para ejecutar el estudio con una credencial de lectura autorizada y revisión humana. Las pruebas locales/mocks no sustituyen esa ejecución.
