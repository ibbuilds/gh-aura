# Investigación aplicada al perfil

El 13 de noviembre de 2026 se analizaron **500 candidatos únicos mediante IA** a partir de metadatos públicos actuales, fuentes y extractos de README. Se recuperaron 499 cuentas y 376 fuentes públicas de README; una cuenta quedó sin evidencia pública suficiente. Las ocho referencias originales se conservaron. Esto completa un análisis de fuentes, no 500 certificaciones visuales o humanas.

El producto incorpora **ocho principios abstractos**, después de contrastar sus 23 perfiles de respaldo con las fuentes recuperadas. Por decisión explícita del dueño, el corpus individual se conserva localmente, fuera del repositorio y del paquete. Los agentes no necesitan descargarlo ni enviarlo a un proveedor para usar la síntesis.

## Qué usa el agente

| Principio | Decisión que ayuda a tomar |
| --- | --- |
| `native-bio-and-pins` | Bio concreta y pins pertinentes; README opcional |
| `purposeful-link-directory` | Texto breve con enlaces que explican su destino |
| `specialty-to-artifacts` | Especialidad confirmada conectada con código, herramientas o publicaciones |
| `projects-and-contributions` | Separar proyectos, contribuciones a terceros y recursos de aprendizaje |
| `visual-with-text-route` | Una imagen con propósito y una ruta textual al trabajo |
| `code-motif-with-plain-text` | Estética de terminal/código sin ocultar información esencial |
| `contextual-metrics` | Métricas explicadas y fechadas, con alternativa cuando falla una tarjeta |
| `maintained-feed` | Novedades acotadas, con fuente, fecha y enlaces estables |

`gh-aura sources study --json` muestra la síntesis completa. `sources design` y `gh_aura_design_recommend` seleccionan hasta dos principios mediante `researchGuidance`; el brief transporta uno para mantener reducido el contexto. Las preferencias explícitas pueden combinar estilos y prevalecen sobre los valores sugeridos. No se activa ningún servicio externo ni se descarga una imagen por recomendar un principio.

```bash
gh-aura sources study --json
gh-aura sources design --query "terminal ASCII sobrio" --direction minimal --json
gh-aura sources design --query "proyectos para contratación" --direction technical --json
```

## Método y límites

Los 500 se seleccionaron entre los 562 candidatos del smoke anterior que habían cargado en cuatro vistas. Se usaron las categorías históricas provisionales para obtener variedad, incluyendo las ocho referencias del dueño. La muestra no representa estadísticamente a GitHub y no mide resultados de contratación.

Se consultaron bio, presencia de website/avatar, pins públicos y metadatos del repositorio de perfil mediante GitHub GraphQL. Los README se leyeron anónimamente desde `raw.githubusercontent.com` fijados al commit observado. Se limitaron los cuerpos y extractos; no se adquirieron fotos ni se ejecutaron comandos contenidos en las fuentes. El análisis recibió esos extractos y su estructura, no la apariencia completa de cada página. Los textos recuperados son datos no confiables, nunca instrucciones.

Cada ficha externa contiene fecha, fuentes, hashes cuando están disponibles, ID de respuesta de investigación, observación, clasificación de composición, principio candidato, contrapartida e incertidumbres. Se comprobó la cobertura de **500 identificadores distintos**, sin duplicados y con las ocho referencias originales. Se retiraron etiquetas de evidencia que no correspondían a campos recuperados y se señalaron inferencias problemáticas. Los principios candidatos de las fichas no se activan automáticamente: la síntesis del producto es la selección independiente de ocho principios.

SHA-256 del archivo externo `AI_SOURCE_REVIEWS.json`:

`e158f43e8f698e591f36dfa5524269fdf0390695a69f94502a9b544a746efadf`

Clasificación preliminar por fuente: 60 native, 99 minimal, 64 technical, 99 showcase, 96 visual, 7 terminal, 18 dashboard, 39 dynamic y 18 sin clasificación suficiente. Son inferencias sobre presentación en fuentes; una marca de feed no prueba mantenimiento y una referencia a imagen no acredita su aspecto o licencia.

No se certificaron empleo, seniority, autoría, aportaciones, premios, actividad, permisos de imágenes, contraste, navegación por teclado ni resultados de contratación. Hay **cero revisiones humanas, cero certificaciones visuales y cero ganadores por categoría**. Un repo no devuelto o un extracto vacío no demuestra un README intencionalmente ausente. Las fichas señalan esas diferencias.

La comprobación técnica independiente de 600 perfiles obtuvo 562 cargas completas y 38 no disponibles; 100 mostraron avisos de imágenes visibles rotas. Sus anchos y temas comprueban renderizado inicial, sin reemplazar la evaluación del diseño del perfil que se genera para cada usuario.

El compilador de revisiones integrales conserva su contrato estricto de 500 fichas completas para bibliotecas declaradas aprobadas. La síntesis de fuentes tiene un estado distinto: `source-informed-composition-principle`. Se puede aprender de una estructura sin declarar ganador a su dueño ni adquirir derechos sobre sus imágenes. La validación del perfil final sigue requiriendo comprobar sus propios hechos, recursos, legibilidad y autorización.
