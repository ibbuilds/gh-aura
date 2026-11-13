# GH Aura — revisión visual acotada de perfiles GitHub

**Fecha de la observación:** 12 de noviembre de 2026 (America/Mazatlan; ejecuciones GitHub Actions registradas en UTC el 13). **Fuente primaria:** páginas de perfil públicas renderizadas con Chromium (modo claro y escritorio) en [ensayo individual](https://github.com/ibbuilds/gh-aura/actions/runs/43359897042) y [contact sheets por estilo](https://github.com/ibbuilds/gh-aura/actions/runs/43362612023). Las imágenes solo se usaron para revisión; no se incorporó arte, fotografía ni texto de terceros al repositorio. Algunas capturas fallaron y no se cuentan como inspección.

**Alcance:** un conjunto de ejemplos contrastados visualmente, **no** 500 inspecciones integrales ni ganadores definitivos. Aquí se analiza el conjunto visible (avatar, identidad lateral, README, pins, achievements y actividad en la ventana). No se completaron temas oscuros, versiones móviles, inspección de todos los enlaces/licencias ni confirmación de contribuciones personales. Ninguna conclusión cuantifica empleabilidad.

## Hallazgos útiles de los perfiles observados

| Dirección visual provisional | Ejemplos vistos directamente | Qué se aprendió | Pendiente / cautela |
| --- | --- | --- | --- |
| Nativo, sin README | [1st1](https://github.com/1st1) | La descripción de proyectos pineados, biografía y gráfico pueden transmitir una carrera sin README | No concluir que todos los casos sin README tienen buena presentación |
| Minimalista | [mattabate](https://github.com/mattabate), [antfu](https://github.com/antfu), [rasbt](https://github.com/rasbt) | Un directorio de enlaces o una biografía corta funcionan cuando la lista de proyectos fija el contexto; sus metas son distintas | Un perfil poco conocido puede necesitar explicar contribución personal y proyectos con mayor detalle |
| Portafolio de proyectos | [guichristovao](https://github.com/guichristovao), [dereknguyen269](https://github.com/dereknguyen269), [mokkapps](https://github.com/mokkapps), [benjamincanac](https://github.com/benjamincanac) | Dos proyectos concretos, una propuesta de herramienta o screenshots reales pueden convertir el perfil en un portafolio legible | Distinguir demostraciones reales de badges de interacción y estadísticas que distraen |
| Visual ilustrado | [WenyuChiou](https://github.com/WenyuChiou), [fzn0x](https://github.com/fzn0x), [davidgcs](https://github.com/davidgcs), [yetone](https://github.com/yetone) | Imágenes propias y una composición de investigación, terminal, código o CV son enfoques diferentes; sus pins/bio importan también | La foto, el tarot ajeno, las imágenes y textos **nunca** se reutilizan como assets; corroborar licencias y móviles |
| Terminal/código | [orhun](https://github.com/orhun), [laohanme](https://github.com/laohanme), [fzn0x](https://github.com/fzn0x), [FlorentCollin](https://github.com/FlorentCollin) | El código que introduce la identidad puede ser expresivo; un perfil con herramientas reales aporta contexto | No inferir que «terminal» es profesional por sí mismo; la tabla extensa o exceso de indicadores puede dificultar lectura |
| Contenido actualizado | [simonw](https://github.com/simonw), [eugeneyan](https://github.com/eugeneyan), [Flipez](https://github.com/Flipez), [athul](https://github.com/athul) | Releases, escritura y artículos fechados aportan información actual; la actualización es útil si corresponde a trabajo real | Flipez presenta mucha información; una sección «No activity tracked» no prueba mantenimiento; evaluar legibilidad móvil |
| Dashboard estadístico | [gautamkrishnar](https://github.com/gautamkrishnar), [anuraghazra](https://github.com/anuraghazra), [Abiola-Farounbi](https://github.com/Abiola-Farounbi) | Los contadores, badges y gráficas compiten con biografía y pins; **ninguno de estos es un ganador garantizado** | Se observaron imágenes remotas rotas en ciertas pantallas; revisar URLs y alternativas textuales antes de recomendar |
| Técnico editorial | [SamuelSchlesinger](https://github.com/SamuelSchlesinger), [morluto](https://github.com/morluto), [martincostello](https://github.com/martincostello) | Existen READMEs públicos con especialización, proyectos, fuentes y contribuciones directas verificables | Se inspeccionó previamente el README original, pero falló el contacto visual de esta categoría: no se considera validación visual equivalente |

## Defecto de la primera clasificación, confirmado por capturas

El primer análisis marcó erróneamente [amelia2802](https://github.com/amelia2802) y [AyushSarode](https://github.com/AyushSarode) como «sin README», porque GraphQL no había expuesto el archivo raíz. **GitHub sí renderiza un README completo** en ambos perfiles: se observó una presentación con encabezados, elementos gráficos y proyectos. La clasificación cambió para priorizar la evidencia visual/HTML sobre la ausencia de un blob GraphQL. [1st1](https://github.com/1st1), en contraste, presenta proyectos pineados sin README en la vista inspeccionada.

Esto demuestra por qué contar archivos o gráficos no basta para establecer el estilo ni la calidad del perfil entero.

## Qué significa la categoría provisional

La [tabla de hipótesis](HOLISTIC_CATEGORY_TRIAGE.md) y el [registro estructurado](holistic-category-triage.json) ordenan las cuentas por señales disponibles. Son una **cola de auditoría**, no los «mejores perfiles». La [plantilla de 561 revisiones](holistic-editorial-review-template.json) deja vacíos, deliberadamente, los juicios visuales y la aprobación. El selector final rechaza las fichas incompletas y exige al menos 500 revisiones integrales.

## Aceptación aún necesaria

En cada candidato finalista se requiere inspeccionar a fondo: imagen/avatar, jerarquía de cabecera, biografía y enlaces, README realmente renderizado, selección y atribución de pins, gráfico visible, achievements, ligas, licencias, fuentes externas y accesibilidad en claro/oscuro y escritorio/móvil. Registrar ausente, privado/no visible, error y no observado como estados diferentes.

**No publicar rankings, ganadores o nuevos patrones predeterminados hasta que esa validación complete la muestra y exista decisión editorial justificada.**
