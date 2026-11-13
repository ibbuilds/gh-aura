# GH Aura — revisión comparativa de finalistas por estilo

**Estado:** selección editorial **provisional** de perfiles que merecen el siguiente análisis; **NO** un ranking de ingenieros ni la lista definitiva de ganadores. Se parte de [600 candidatos únicos](profile-candidates-600.json), [561 cuentas recuperadas](holistic-public-observations-summary.json), [datos públicos del README, pins y achievements](html-facets), las [ocho categorías](HOLISTIC_CATEGORY_TRIAGE.md) y la [revisión visual acotada](HOLISTIC_VISUAL_SPOTCHECKS.md).

La comparación debe valorar el **conjunto del perfil**: avatar/identidad, biografía, enlaces, README, selección de repositorios fijados, gráfico, achievements y composición visual. Un excelente README no compensa automáticamente un conjunto incoherente, y **no tener README puede ser perfectamente válido**. No se utilizan estrellas, seguidores, cantidad de commits ni cantidad de insignias como prueba de competencia.

| Estilo | Finalistas que merecen inspección integral | Motivo de interés | Qué puede descalificar un patrón |
| --- | --- | --- | --- |
| Nativo sin README | [1st1](https://github.com/1st1), [0intro](https://github.com/0intro), [333fred](https://github.com/333fred) | Trayectoria y repositorios pineados sin depender de un README largo; 1st1 se contrastó en vista de escritorio | Pines sin descripciones, ausencia de propósito, enlaces que no muestran trabajo propio |
| Minimalista | [mattabate](https://github.com/mattabate), [antfu](https://github.com/antfu), [rasbt](https://github.com/rasbt), [serenakeyitan](https://github.com/serenakeyitan) | Enlaces intencionales, especialidad breve y trabajo verificable; perfiles con distintas necesidades comunicativas | Una introducción demasiado corta para alguien sin proyectos conocidos |
| Técnico-editorial | [SamuelSchlesinger](https://github.com/SamuelSchlesinger), [morluto](https://github.com/morluto), [martincostello](https://github.com/martincostello), [jeroenvervaeke](https://github.com/jeroenvervaeke) | Proyectos, investigación y contribuciones enlazadas a fuentes públicas; buena materia prima para explicar especialización real | Inventarios largos, afiliaciones no corroboradas o falta de evidencia de autoría |
| Portafolio de proyectos | [guichristovao](https://github.com/guichristovao), [dereknguyen269](https://github.com/dereknguyen269), [mokkapps](https://github.com/mokkapps), [benjamincanac](https://github.com/benjamincanac) | Diseño y selección de proyectos como experiencia central; se contrastaron ejemplos visualmente en escritorio | Páginas promocionales que ocultan código, screenshots desactualizadas o marketing sin pruebas |
| Visual ilustrado | [WenyuChiou](https://github.com/WenyuChiou), [davidgcs](https://github.com/davidgcs), [fzn0x](https://github.com/fzn0x), [yetone](https://github.com/yetone) | Ilustraciones de dominio, identidad original y composición técnica/marca; WenyuChiou fue inspeccionado con un screenshot completo de escritorio | Arte con derechos inciertos, animaciones invasivas, demasiado peso gráfico o información técnica ilegible |
| Terminal y código | [orhun](https://github.com/orhun), [laohanme](https://github.com/laohanme), [FlorentCollin](https://github.com/FlorentCollin), [fzn0x](https://github.com/fzn0x) | Motivos de terminal y código pueden demostrar una identidad técnica coherente si enlazan herramientas reales | Código como decoración sin función, ASCII inaccesible o múltiples animaciones |
| Dashboard de datos | [gautamkrishnar](https://github.com/gautamkrishnar), [anuraghazra](https://github.com/anuraghazra), [Abiola-Farounbi](https://github.com/Abiola-Farounbi) | Casos contrastantes de métricas y widgets, **no recomendados aún como patrones predeterminados** | Contadores rotos, información irrelevante, dependencias frágiles o métricas engañosas |
| Contenido dinámico | [simonw](https://github.com/simonw), [eugeneyan](https://github.com/eugeneyan), [Flipez](https://github.com/Flipez), [athul](https://github.com/athul) | Actualizaciones de releases, trabajo y publicaciones; en Simon se vio una presentación completa y unificada con sus pins y logros | Actualizaciones abandonadas, sobrecarga de bloques o mantenibilidad insuficiente |

## Evidencia adicional tras las 600 pruebas de renderizado

La [prueba técnica de cuatro vistas](VISUAL_RENDER_SMOKE.md) consiguió imágenes en escritorio/móvil y claro/oscuro para **562 cuentas**. Se identificaron **91 indicadores de imágenes visibles no cargadas**; **64** pertenecen al grupo provisional de dashboards. Por tanto, la presencia de contadores y gráficos **no** será una señal de elegibilidad profesional por sí sola. El orden de esta tabla sigue siendo una lista de finalistas para comparar, no una lista de ganadores. El informe no contiene licencias verificadas ni valoraciones individuales completas.

## Juicios editoriales comparables y límites

**Direcciones con ejemplos especialmente informativos:** `minimal-text`, `technical-editorial`, `project-showcase`, `visual-illustrated` y `dynamic-content`. La diversidad es importante: una imagen o dashboard no deben imponerse a todo usuario.

**Dashboard no es una recomendación automática.** En la inspección parcial de perfiles con muchos contadores se detectaron imágenes remotas rotas. Es necesario comprobar la verdad, licencia, disponibilidad y relevancia de cada cifra. Más tarjetas no equivalen a más profesionalismo.

**Poteto y yetone siguen preservados.** Son casos de contraste visual, no sustitutos de una biografía y proyectos para todos los usuarios; ningún recurso original se copiará.

**Los ocho ejemplos originales del usuario permanecen en la investigación**, aunque no todos deban ganar una categoría. La clasificación de los 600 es una hipótesis estructural; hay referencias de otros estilos que pueden resultar mejores tras inspección de diseño.

**Requisitos para aprobar:** revisiones directas con fecha de avatar/identidad, bio, enlaces, README y pins, gráfica y achievements, desktop/móvil claro/oscuro, accesibilidad, activos y atribución; comparación con alternativas de la misma categoría; registro del criterio de inclusión/exclusión y conflictos. El uso de los perfiles en generación de IA sigue sujeto a aprobación editorial: no son plantillas.

Esta lista **no activa patrones automáticamente** y no cambia las preferencias del usuario. La evidencia y los bloqueos continúan en [#69](https://github.com/ibbuilds/gh-aura/issues/69).
