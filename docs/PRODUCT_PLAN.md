# GH Aura: plan definitivo de producto y entrega

**Current release:** v1.18.0
**Actualizado:** 13 de noviembre de 2026, America/Mazatlan.
**Base verificada y archivo:** d978bbae0234b30390885fc17bb7f2b6d52bc21b.
**Estado:** limpieza e implementación técnica en la rama `codex/cleanup-and-delivery-plan`. No es una release publicada ni una certificación de resultados reales.

Este es el plan único de ejecución. Las guías de comandos describen el comportamiento actual; este documento fija resultado objetivo, entregables, dependencias y comprobaciones de terminado. Sustituye la hoja de ruta anterior centrada principalmente en el README.

**Decisión posterior del dueño:** ejecutar el desarrollo y las simulaciones ahora; el dueño probará las cuentas y recorridos reales cuando esté listo. No se piden credenciales ni se usan cuentas reales para dar por terminados esos pilotos. La propuesta exacta de AGENTS/Skill/llms fue aprobada y aplicada.

Entrega técnica actual:

- P0: corpus, recolectores y pruebas históricas fuera del árbol activo, recuperables desde la base inmutable y comprobables con `test:research`.
- P1: controles estrictos, informe compacto de carencias y compilador de patrones; 500 revisiones/3 por categoría requeridas. La exportación de investigación corrige el filtro de imágenes y conserva trazabilidad; la regresión 390 × 844 pasó en Edge. El catálogo aprobado sigue vacío porque las revisiones integrales no se han realizado.
- P2/P3: intención/refinamientos compartidos, contexto, plan/preview vinculados a bytes, cuenta real, README/assets atómicos, USER/USER nuevo o vacío, PR o commit, estado y reconciliación.
- P4: scans paginados, proyectos externos explícitos, evidencia progresiva y aportes declarados a forks; propuestas separadas de descripción/topics/README con razones y diff. Pins se preparan para la UI soportada y su estado se comprueba por lectura. Las propuestas no son autorizaciones ni mutan otros repos.
- P5: campañas de una o dos cuentas con alcance aprobado y pausa ante premios/tiers desconocidos; coautoría y Q&A con contenido exacto, presupuesto por identidad y reconciliación. Alta de cuentas, permisos y categorías son prerrequisitos del proveedor.
- P6: objetivos diarios sobre baseline observado, archivos sin solapamiento, preflight de identidad/baseline y reconciliación de publicación por SHA antes del readback del gráfico. Hoy requiere workspace ya inicializado y badges terminados.
- P7: instalador de Skill y diagnóstico, contexto integral y ejecución/estado expuestos solo para el plan fijado por dueño/host; errores saneados y pruebas del paquete instalado.

La investigación editorial pendiente, los pilotos de cuentas/clientes/usuarios y una nueva versión siguen siendo aceptación separada. No se cierran por pruebas simuladas. `main` ya está protegido: una revisión independiente, siete checks vinculados a GitHub Actions, revisión de último push, conversaciones resueltas, sin force-push/borrado y administradores incluidos; verificado mediante API el 13-11-2026. [Guía operativa del incremento](IMPROVE.md).

Validación local del candidato: pruebas de producto, **46/46 del archivo histórico**, sintaxis y empaquetado/instalación offline correctos en Windows, Node 24. La matriz remota del PR se comprueba por separado.

Incremento posterior: el render nativo y los comandos README/brief/diff aceptan el mismo Spec; el plan conserva sus requisitos y comprueba evidencia seleccionada. Hay verificación anónima opcional de recursos públicos con límites de red, cinco ejemplos originales y medición del recorrido integral. La comparación controlada de contexto pasó de 11 a 8 solicitudes, con 2 para un borrador nativo. Los ejemplos y las comprobaciones HTTP no sustituyen revisión visual, derechos reales ni pruebas con participantes.

El calendario conserva además el baseline diario suministrado y ofrece preview JSON/SVG por año mediante CLI/MCP. Distingue conteos conocidos, desconocidos, aportes y proyección; no garantiza colores ni atribución de GitHub.

## 1. Objetivo acordado

GH Aura debe permitir que una persona o su agente mejoren el **perfil completo de GitHub** de acuerdo con su rol, propósito y estilo: README, biografía y datos públicos, identidad visual, proyectos/pins, achievements disponibles y mapa de contribuciones.

La persona puede usar comandos directamente o pedir el resultado a su IA. Ambos caminos comparten intención, evidencia, planes, validaciones y operaciones. El agente interpreta y compone; el núcleo ejecuta operaciones deterministas y comprueba resultados. El objetivo profesional es comunicar trabajo relevante y verificable rápidamente a un hiring manager o recruiter.

Recorrido objetivo: **intención → inspección → plan de perfil → vista previa → autorización → aplicación → verificación**.

Decisiones conservadas:

- Node 22+, módulos ES, cero dependencias de ejecución y funcionamiento local.
- IA elegida por el usuario, sin proveedor ni API de pago obligatorios.
- Composiciones originales y estilos combinables. Las preferencias explícitas gobiernan los valores sugeridos.
- README, bio y proyectos comunican hechos reales. La actividad sintética y los ejercicios de badges se identifican y no se convierten en experiencia profesional.
- Un workspace privado, propio y marcado, reutilizado por Activity y Badges. El repositorio público USER/USER presenta el perfil y sus assets autorizados.
- Autorización del dueño para escrituras, vinculada a destino, operaciones y presupuesto revisados. Un argumento o un hash generado por el modelo no demuestra aprobación humana.
- Sin GitHub Pages, servidor de perfiles, cuentas de pago obligatorias, publicación npm automática ni copias de identidades o assets ajenos.
- Skill, MCP, CLI y prompt portable. La compatibilidad se declara por cliente y capacidad realmente comprobados.

## 2. Punto de partida

| Área | Existe | Pendiente |
| --- | --- | --- |
| Composición | 29 fuentes, 25 técnicas, ProfileSpec, cuatro direcciones flexibles y tres presentaciones del CLI | Patrones derivados del estudio, intención compartida y calidad demostrada |
| Investigación | 600 candidatos mixtos; 561 observaciones GraphQL/HTML; 562 renders en cuatro vistas | Revisión integral y síntesis por estilo |
| Trending | 66 cuentas con fechas heterogéneas; tres coinciden con los 600 | Incorporación trazable y contextual al estudio |
| Bio | Guía narrativa para Markdown | Bio lateral de 160 caracteres y actualización de campos |
| Proyectos | Ranking por rol; inspecciones opcionales | Cobertura declarada, evidencia de finalistas y pins aplicados |
| Achievements | Intentos Pull Shark, YOLO y Quickdraw; dos cuentas verificadas solo en lectura | Premios reales, rutas viables de dos cuentas y campañas autorizadas |
| Calendario | Fechas, densidad, intensidad y aplicación privada | Objetivos diarios, vista previa y verificación conjunta con badges |
| Agentes | 22 herramientas de lectura, planificación y validación | Instalación, activación y aplicación autorizada completas |
| Validación | Pruebas automáticas, CI e integración pública de lectura | Recorridos reales con agentes, usuarios y cuentas privadas |

El archivo conserva **0 revisiones editoriales integrales aprobadas y 0 ganadores finales**. Los 562 renders son comprobaciones técnicas del primer encuadre; no completan las 500 revisiones del issue #69.

## 3. Contratos y arquitectura objetivo

Ampliar los módulos existentes; evitar un segundo motor o una reescritura general.

- **ProfileSnapshot:** cuenta, fecha/frescura, visibilidad, README/assets, bio/campos, pins y orden, repositorios candidatos, contribuciones y achievements observados. Distingue observado, ausente, oculto, inaccesible y desconocido.
- **ProfileSpec versionado:** propósito, rol objetivo, estilos/etiquetas, idioma, densidad, voz, bio lateral, narrativa README, proyectos, enlaces, media/derechos y objetivos opcionales de badges/calendario. Conserva elecciones durante revisiones.
- **PatternRecord:** ID, estilos, contexto del usuario, propósito, principio de composición, evidencia requerida, técnicas/assets, límites GitHub, alternativas, mantenimiento, fuentes fechadas y decisión editorial.
- **ProfilePlan versionado:** diferencias por componente, revisión anterior, operaciones exactas, cuentas/repos destino, permisos, dependencias, presupuesto, aprobación y comprobaciones. Permite omitir componentes y aplicar un subconjunto.
- **ExecutionResult:** estado por operación: planificada, necesita acción del usuario, aprobada, ejecutándose, verificada, fallida o resultado desconocido; referencias saneadas y recuperación.

CLI y MCP consumen los mismos handlers. Las lecturas pueden reutilizar una sesión; la ejecución refresca el estado necesario para detectar cambios concurrentes. Se mantiene compatibilidad de configuraciones/reviews anteriores o se proporciona una migración explícita y probada. Tokens y datos privados innecesarios quedan fuera de planes y prompts.

## 4. Secuencia de entrega

| Fase | Resultado | Dependencias | Estado inicial |
| --- | --- | --- | --- |
| P0 | Árbol limpio y evidencia recuperable | Base verificada | Verificada localmente; pendiente integración |
| P1 | Conocimiento de estilos respaldado por investigación | P0 | Pendiente |
| P2 | Snapshot, intención y plan integral versionados | P0 y contrato PatternRecord | Pendiente |
| P3 | README, assets y datos de cuenta completos | P2; patrones P1 para aceptación editorial | Pendiente |
| P4 | Proyectos/pins pertinentes y aplicables | P2 | Pendiente |
| P5 | Achievements viables y campañas verificadas | P2 y acceso privado de prueba | Pendiente técnico/externo |
| P6 | Calendario controlable y comprobado | P2 y efectos de P5 definidos | Pendiente |
| P7 | Experiencia para agentes e instalación | P2; integra P3–P6 | Pendiente |
| P8 | Resultados profesionales evaluados en uso real | P1 y recorridos P3–P7 | Pendiente externo |
| P9 | Integración, distribución y release verificadas | P0–P8 y main protegido | Pendiente |

P1 y P2 pueden avanzar en paralelo con fixtures identificados como sintéticos. P3/P4 pueden implementarse después de P2 sin esperar premios de GitHub. La protección de main empieza desde P0 y se resuelve antes de integrar una release.

**Primer incremento útil:** README + bio + proyectos completados mediante CLI y un agente, conservando refinamientos y autorización. El producto completo también exige cerrar achievements, calendario y validación externa.

## P0. Limpieza, procedencia y conservación

Entregables de esta petición:

1. Retirar del árbol activo datasets, reportes, colectores y pruebas exclusivas del estudio; preservar el checkpoint completo en Git.
2. Mantener research/README.md como índice compatible y fijar las citas del runtime al commit archivado.
3. Separar npm test para el producto de npm run test:research para verificar el archivo. Conservar en el producto los casos de taxonomía y límites de referencias que antes estaban mezclados con datasets.
4. Mantener fuera del paquete corpus y colectores. Adaptar la lectura de npm pack --json al formato de npm 12 para verificar el artefacto instalado.
5. Consolidar este plan, README, arquitectura y readiness. Conservar comandos, funciones y archivos de instrucciones de agentes.

**Terminado cuando:** sintaxis, producto, paquete instalado y archivo pasan; enlaces/citas funcionan; no cambian versión, credenciales, reglas de publicación o comportamiento de funciones. Se reduce el árbol activo, no el historial Git.

**Comprobación de esta limpieza:** Node 24.15.0 y npm 12.0.2 en Windows: 292/292 pruebas del producto, 46/46 del archivo histórico, sintaxis y paquete instalado offline correctos. Los enlaces locales también se comprobaron. La CI de esta rama todavía no se ha ejecutado.

## P1. Investigación convertida en conocimiento del producto

**Consumidores:** archivo de investigación en una copia de trabajo separada; src/profile-patterns.mjs, src/holistic-profile-taxonomy.mjs, src/profile-techniques.mjs, src/profile-query.mjs, src/brief.mjs y pruebas pequeñas.

- **P1.1 Depurar fuentes.** Recuperar el archivo, conservar las ocho referencias originales, deduplicar y revisar cuentas inaccesibles. Incorporar Trending con página, período y adquisición reales. Completar estilos con pocos ejemplos. Popularidad, imágenes o estrellas no asignan calidad ni categoría.
- **P1.2 Reparar instrumentos.** Corregir el filtro de imágenes que compara top con innerWidth y probar una imagen en la mitad inferior de 390 × 844. Endurecer la validación editorial: fecha válida, revisor identificable, notas no vacías y evidencia de facetas, accesibilidad, assets/atribución y vistas. Repetir las observaciones afectadas, manteniendo procedencia de la corrección.
- **P1.3 Completar revisiones.** Mantener el objetivo de 500 perfiles completos y al menos tres por categoría. Revisar avatar, cabecera/bio, enlaces, README renderizado o ausencia legítima, pins, gráfico, achievements y conjunto. Registrar evaluación directa, autor, incertidumbres y revisión humana realmente realizada; no contar metadatos o screenshots como aceptación editorial.
- **P1.4 Destilar patrones.** Relacionar las ocho categorías con direcciones y controles del CLI. Separar sobriedad, expresividad, densidad y propósito. Registrar pendiente, aprobado, condicional o excluido con razones y alcance. Seleccionar principios útiles sin imponer 25 ganadores ni copiar perfiles.
- **P1.5 Integrar selección.** Suministrar al brief uno o dos patrones pertinentes y sus límites. Pendientes/excluidos no condicionan resultados automáticos. Mantener consulta explícita de ejemplos provisionales con su etiqueta y permitir diseños fuera del catálogo mediante técnicas compatibles.

**Terminado cuando:** cada patrón activo remite a observaciones revisadas y reproduce su criterio de selección; hay alternativas para usuario nuevo, profesional con proyectos y mantenedor conocido; las peticiones sobrias, terminal, editoriales, ilustradas e híbridas reciben patrones pertinentes. El cierre de las 500 revisiones tiene evidencia independiente del código.

## P2. Intención, inspección y plan compartidos

**Módulos:** src/agent-profile.mjs, src/config.mjs, src/github.mjs, src/brief.mjs, src/workflow.mjs y adaptadores.

- **P2.1 Snapshot completo.** Obtener facetas bajo permisos mínimos; incluir pins actuales y cobertura de repos. Exponer muestreo, truncamiento, frescura y datos faltantes.
- **P2.2 Spec único.** Incluir cuenta, README, assets, proyectos, badges y calendario en contratos componibles. Separar bio lateral de narrativa README y rol objetivo de empleo actual. Admitir perfil sin README y componentes sin cambios.
- **P2.3 Refinamiento persistente.** Guardar/cargar intención sin perder secciones, orden, voz o autorización válida. Validar datos en ejecución; rechazar versiones desconocidas; mantener secretos fuera del estado.
- **P2.4 Plan y aprobación.** Mostrar qué cambia, destino, permisos, coste y comprobación. Vincular aprobación externa a operaciones exactas. Mantenerla durante lotes incluidos; renovarla si cambia destino, contenido, alcance o presupuesto.
- **P2.5 Recuperación.** Registrar resultados saneados y reconciliar escrituras inciertas antes de reintentar. Evitar duplicados y conservar avances independientes ante un fallo.

**Terminado cuando:** una misma intención produce el mismo plan operativo en CLI y MCP; guardar/cargar/refinar conserva elecciones; cuentas equivocadas, revisiones obsoletas y cambios concurrentes bloquean la operación afectada; se prueban estados parciales y migración de reviews anteriores.

## P3. README, assets y datos públicos

**Módulos:** src/render.mjs, src/editorial.mjs, src/profile-review.mjs, src/profile-biography.mjs, src/workflow.mjs, src/pull-request.mjs y operaciones soportadas de identidad.

- **P3.1 Composición coherente.** Consumir el Spec tanto en render determinista como en briefs. Mantener diseños libres y controles independientes. Sustituir la alerta universal de severidad alta por no tener README por una evaluación contextual. Título y longitud respetan el estilo.
- **P3.2 Bio y cuenta.** Generar bio lateral de hasta 160 caracteres y narrativa README separadas. Permitir campos confirmados y solicitados: nombre, website, ubicación, compañía y otros soportados. Mostrar valores anteriores/nuevos y verificar PATCH /user. No alterar email o privacidad como efecto colateral.
- **P3.3 Primera publicación.** Resolver la ausencia del repo público USER/USER de forma revisable; crear solo ese destino cuando esté autorizado. Soportar edición del perfil existente, PR o commit según elección.
- **P3.4 Assets propios.** Incorporar ilustraciones, SVG o capturas aportadas/generadas para el usuario con derechos, alt, tamaño y rutas revisados. Planificar y publicar los archivos necesarios junto al README. Comprobar referencias relativas, temas y alternativa legible.
- **P3.5 Validación.** Detectar placeholders, afirmaciones sin sustento, enlaces inseguros, pérdida de proyectos elegidos y recursos fallidos. Revisar enlaces/media con límites apropiados, mostrar diff y comprobar el resultado remoto. La vista previa corresponde al candidato exacto revisado.

**Terminado cuando:** perfiles nuevos/existentes completan el recorrido; bio cumple el límite; campos no seleccionados se preservan; estilos distintos funcionan dentro del Markdown de GitHub; assets/enlaces se resuelven; cambios concurrentes invalidan las operaciones afectadas. Ancho y tema se comprueban como legibilidad del resultado, no como criterio para imponer un estilo.

## P4. Proyectos relevantes y pins

**Módulos:** src/engine.mjs, src/github.mjs, src/inspection.mjs, src/project-evidence.mjs, src/job-match.mjs y src/readiness.mjs.

- **P4.1 Cobertura.** Paginar candidatos públicos con presupuesto y continuación. No presentar los primeros 200 alfabéticos como todos los repos. Permitir un repo explícito y aportes públicos en organizaciones cuando el usuario quiera mostrarlos.
- **P4.2 Evidencia progresiva.** Seleccionar por rol y después inspeccionar propósito, README, demo/docs, archivos de pruebas/CI y aporte personal. Distinguir presencia de archivos, CI observado y ejecución real; no ejecutar código ajeno para calificarlo.
- **P4.3 Ranking explicable.** Justificar seleccionados y descartados relevantes. Usar popularidad como señal auxiliar; contemplar contribuciones sustanciales a forks. El usuario puede cambiar orden, selección y exclusiones.
- **P4.4 Pins aplicables.** Proponer hasta seis items ordenados con una razón por item. Usar una vía soportada; si hace falta UI/manual, entregar selección/orden listos y una acción concreta. Mantener estado de acción pendiente hasta comprobar los pins. No inventar una API.
- **P4.5 Mejoras de proyectos.** Proponer descripciones, topics o documentación como cambios separados y revisables. Mantener consistencia entre pins, bio y README sin alterar repos fuera del alcance.

**Terminado cuando:** un repo relevante fuera del primer lote sigue siendo elegible; se obtiene evidencia de un candidato concreto; selección, orden y aporte son explicables; una recomendación no se presenta como pin aplicado.

## P5. Achievements gratuitos y campañas viables

**Módulos:** src/achievement-matrix.mjs, src/achievements.mjs, src/badge-run.mjs, src/badge-accounts.mjs, src/badge-bulk-git.mjs, src/badge-write-budget.mjs y src/workspace.mjs.

- **P5.1 Matriz operativa.** Registrar requisitos, coste, estado activo/histórico/inactivo, cuentas, visibilidad, fuente/fecha, ruta y evidencia de premio. Separar gratuito de automatizable; pago excluido por defecto. Estrellas y aceptación externa conservan su dependencia real.
- **P5.2 Piloto real.** Con cuenta de prueba autorizada y workspace privado marcado, ejecutar primero dos PRs y el intento Quickdraw. Registrar eventos, revisiones y SHA; comprobar por separado Pull Shark, YOLO y Quickdraw visibles. Resolver premios ausentes antes de escalar.
- **P5.3 Segunda cuenta.** Guiar creación/conexión por mecanismos permitidos del proveedor, con intervención humana cuando la exija. Verificar identidades, permisos y atribución de email/coautoría. Implementar operaciones de coautoría y otras rutas gratuitas tras comprobar requisitos y elegibilidad. Dos tokens con acceso de lectura no completan esta función; no atribuir colaboración inexistente.
- **P5.4 Campaña autorizada.** Revisar logro/tier, repo, cuentas, estrategia, operaciones máximas y presupuesto. Ejecutar lotes bajo esa autorización con pacing, reservas, idempotencia y reanudación. El número de lote no exige por sí solo nueva aprobación; un cambio de alcance sí.
- **P5.5 Resultado y tiers.** Separar elegible, planificado, eventos observados, premio observado, no concedido y desconocido, con fecha/fuente. Verificar tiers progresivamente; contar 1.024 PRs no demuestra Gold. Mantener un método visible de comprobación cuando GitHub no tenga API estable.

**Terminado cuando:** cada ruta anunciada como funcional tiene piloto y premio comprobados; cuentas/permisos/repos/revisiones incorrectos bloquean escrituras; interrupciones no duplican eventos; métodos no comprobados conservan su estado. El workspace se reutiliza sin perder Activity y nunca se borra automáticamente.

## P6. Mapa de contribuciones controlable

**Módulos:** src/calendar.mjs, src/calendar-apply.mjs, src/contributions.mjs, src/local-attribution.mjs y plan integral.

- **P6.1 Objetivo diario.** Admitir rangos, densidad/distribución e intensidad, además de cantidades/días explícitos y patrones pedidos. Separar conteos existentes, solicitados, añadidos y estimación visual. GitHub determina el color final.
- **P6.2 Vista previa.** Mostrar antes/después, operaciones por día, zona horaria, atribución y límites. Distinguir actividad observada de sintética; fechas desconocidas no equivalen a cero.
- **P6.3 Aplicación.** Reutilizar workspace privado marcado, email verificado y fast-forward. Respetar límites por lote dentro del plan aprobado; tratar fechas repetidas y objetivos sobre días activos. No modificar historia o repos ajenos.
- **P6.4 Coordinación.** Considerar los efectos de PRs/commits de badges sobre el gráfico antes de completar el calendario. Compartir presupuesto y serializar escrituras incompatibles; preservar operaciones de ambas funciones.
- **P6.5 Verificación.** Leer el gráfico tras procesamiento y comparar solicitado/ejecutado/observado/desconocido. Comprobar visibilidad privada, ramas, email, fechas y retrasos. Reconciliar resultados inciertos; una reversión destructiva tiene plan independiente.

**Terminado cuando:** planes reproducibles y ejecución concuerdan en operaciones; reanudar no pierde datos ni duplica trabajo; discrepancias con GitHub tienen evidencia. Límites para reducir actividad existente o conseguir tonos concretos aparecen antes de aplicar.

## P7. Agentes, instalación y descubrimiento

**Módulos:** src/agent-tools.mjs, src/mcp-server.mjs, src/agent-command.mjs, CLI y documentación.

Las propuestas para AGENTS.md, skills/gh-aura-profile/SKILL.md y llms.txt se presentan como diff concreto y requieren autorización humana para esas instrucciones antes de modificarlas.

- **P7.1 Entrada integral.** Una petición de mejorar el perfil activa el recorrido y determina componentes solicitados. Cargar instrucciones detalladas por área bajo demanda; conservar refinamientos y omisiones.
- **P7.2 Ejecución autorizada.** Exponer inspección, spec/refinamiento, plan, preview, ejecución, estado y verificación mediante handlers comunes con CLI. La aprobación procede del dueño/host fuera del contenido generado. El agente ejecuta lo aprobado sin que la persona reconstruya comandos.
- **P7.3 Contexto eficiente.** Reutilizar snapshots por cuenta/visibilidad/frescura; inspeccionar repos concretos y devolver resúmenes, cursores y cobertura. Cargar patrones/fuentes pertinentes. Medir bytes, llamadas y tiempos antes/después en recorridos representativos.
- **P7.4 Errores recuperables.** Códigos y acciones claras para instalación incompleta, versión, permisos, rate limits, estado obsoleto y resultado incierto. JSON limpio en stdout; secretos fuera de mensajes.
- **P7.5 Instalación real.** Entregar instalación versionada y diagnóstico de CLI, recursos, skill y MCP. Probar inicialmente Codex, Claude Code y un tercer cliente MCP real. La skill queda en una ubicación descubierta por el host. Documentar capacidades comprobadas, no solo un ejemplo de configuración.
- **P7.6 Distribución.** Describir el perfil completo, mostrar resultados propios y distribuir en catálogos compatibles cuando el dueño lo autorice. Mantener prompt portable para clientes sin ejecución. No prometer descubrimiento universal de un archivo publicado en GitHub.

**Terminado cuando:** peticiones naturales español/inglés activan la skill instalada; tres clientes completan recorridos con preferencias conservadas y ejecución autorizada; el cliente sin herramientas recibe una alternativa útil. Las optimizaciones tienen mediciones y mantienen comportamiento/permisos.

## P8. Calidad profesional y uso independiente

**Entregables:** ejemplos originales antes/después, informe de recorridos y resultados saneados según [HUMAN_VALIDATION.md](HUMAN_VALIDATION.md).

- **P8.1 Casos.** Usuario con poca experiencia pública, software/backend engineer, mantenedor OSS, investigación y perfil visual/creativo. Probar composiciones breves, técnicas, portafolio, expresivas e híbridas, además de revisiones posteriores.
- **P8.2 Lectura rápida.** Evaluar si en el primer minuto se identifica rol/propósito, trabajo relevante, aporte personal y contacto deseado. Registrar hallazgos y confusiones; no convertirlos en probabilidad de contratación.
- **P8.3 Calidad visual.** Revisar enlaces, recursos, texto alternativo, orden y legibilidad escritorio/móvil/claro/oscuro en los perfiles generados. Usar ejemplos propios o autorizados. Verificar que badges, gráficos y decoración no escondan trabajo.
- **P8.4 Participantes reales.** Ejecutar el protocolo existente con al menos cinco personas que consientan. Incluir revisores con experiencia en contratación para afirmar resultados específicos sobre recruiters/hiring managers. Probar instalación limpia, activación, refinamiento y recuperación. No recopilar tokens ni datos privados.
- **P8.5 Cierre.** Relacionar cada defecto importante con corrección y revalidación; publicar agregados y ejemplos consentidos. Conservar fallos y límites observados.

**Terminado cuando:** estilos diferentes comunican hechos correctos y trabajo inspeccionable; CLI e IA completan recorridos; hay evaluaciones reales y defectos importantes resueltos. CI y ausencia de avisos heurísticos no sustituyen esta evidencia.

## P9. Integración y release

**Módulos:** .github/workflows/ci.yml, scripts/package-smoke.mjs, scripts/live-smoke.mjs, package.json, changelog, release notes y guías.

- **P9.1 Protección.** Administrador activa main protegido, PRs/revisión, seis checks Node 22/24 × Linux/macOS/Windows y la integración pública. Prohibir force-push y borrado; verificar reglas efectivas.
- **P9.2 Regresiones.** Checks enfocados en cada cambio y matriz completa en el candidato. Probar autorización, privacidad, concurrencia, idempotencia, errores, planes antiguos y empaquetado. El archivo histórico tiene comando separado y fuente inmutable.
- **P9.3 Artefacto.** Empaquetar e instalar offline fuera del checkout; probar CLI, recursos/Skill y MCP desde lo instalado. Verificar npm soportados, checksum, contenido permitido, links y ausencia de corpus, secretos o archivos del usuario.
- **P9.4 Versiones.** Publicar versión nueva al aceptar los cambios de producto; alinear package/tag/tarball/notas y compatibilidad. Distinguir main del artefacto v1.18.0 existente; conservar actualización/reversión y tags.
- **P9.5 Publicación.** Preparar la release revisable, obtener autorización externa y comprobar el artefacto publicado. Reconciliar issues con evidencia; no cerrar #69 por renders ni #53 por eventos. npm registry sigue siendo una decisión independiente.

**Terminado cuando:** CI y artefacto instalado pasan en la revisión candidata; main está protegido; pruebas reales disponibles; publicación coincide con lo verificado. Ningún resultado desconocido aparece como éxito.

## 5. Definición de producto al 100%

- [ ] Investigación integral y selección cerradas con evidencia; patrones activos aprobados, trazables y originales preservados.
- [ ] Intención editable compartida por CLI, Skill y MCP, sin pérdida de preferencias.
- [ ] README/assets compuestos y publicados para perfiles nuevos/existentes y estilos distintos.
- [ ] Bio lateral y campos solicitados actualizados y comprobados sin cambios colaterales.
- [ ] Proyectos relevantes respaldados por evidencia; situación real de pins comprobada.
- [ ] Cada ruta anunciada de achievements tiene piloto/premio observados; otras muestran sus requisitos y límites.
- [ ] Calendario y convivencia con Badges validados realmente; atribución y resultados inciertos visibles.
- [ ] Agentes soportados instalados, activados y capaces de completar aplicación autorizada y verificación.
- [ ] Evaluación con usuarios/revisión profesional realizada; defectos importantes corregidos y revalidados.
- [ ] Matriz automática, artefacto, protección de main y release final comprobados.

Una prueba externa no realizada sigue pendiente aunque el código esté terminado. Los incrementos pueden entregarse con su alcance y limitaciones; el producto completo exige todos estos resultados.

## 6. Responsables y desbloqueos concretos

| Compromiso | Responsable | Evidencia |
| --- | --- | --- |
| Código, contratos, pruebas, paquete | Implementador; dueño revisa resultado | Diff, checks y artefacto |
| Patrones y criterios | Revisor editorial identificado; dueño valida | Fichas, comparaciones y decisiones |
| Cuentas/repos de prueba | Dueño autoriza acceso y configura permisos | Identidades saneadas, operaciones y premios/gráfico |
| Acciones del agente | Dueño/host autoriza | Alcance aprobado y operaciones ejecutadas |
| Protección de main | Administrador | Reglas y checks efectivos |
| Clientes y usuarios | Implementador y participantes | Versiones, recorridos, errores y correcciones |
| Publicación externa | Dueño autoriza; implementador verifica | Versión/tag/checksum y artefacto accesible |

No se presupone acceso a cuentas de prueba, participantes ni elegibilidad privada de GitHub. Cada dependencia externa tiene piloto o acción de dueño. No se inventan plazos: las estimaciones se fijan tras medir el primer incremento.

## 7. Evidencia y pendientes relacionados

- [Archivo íntegro](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research) e [instrucciones de recuperación](../research/README.md).
- [#69 investigación integral](https://github.com/ibbuilds/gh-aura/issues/69), [#65 historial de composición](https://github.com/ibbuilds/gh-aura/issues/65).
- [#47 main](https://github.com/ibbuilds/gh-aura/issues/47), [#48 workspace real](https://github.com/ibbuilds/gh-aura/issues/48), [#53 premios/dos cuentas](https://github.com/ibbuilds/gh-aura/issues/53).
- [#61 clientes de IA](https://github.com/ibbuilds/gh-aura/issues/61), [#49 usuarios](https://github.com/ibbuilds/gh-aura/issues/49).
- [GitHub bio](https://docs.github.com/en/account-and-profile/tutorials/personalize-your-profile), [actualizar cuenta](https://docs.github.com/en/rest/users/users#update-the-authenticated-user), [pins](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile).
- [Contribuciones](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference), [coautoría](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors).
- [Agent Skills: integración](https://agentskills.io/integrate-skills) y [formato](https://agentskills.io/specification).
