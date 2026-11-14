# GH Aura: producto y entrega

**Current release:** v1.18.0
**Estado:** implementación en PR #73; la publicación existente permanece sin cambios.

## Objetivo

Mejorar el perfil completo de GitHub con la IA preferida del usuario o con comandos directos. El resultado respeta su propósito y estilo y hace comprensible su trabajo real.

## Recorrido del agente

1. Entender propósito, rol objetivo, idioma y estilo; reutilizar lo que el usuario ya explicó.
2. Inspeccionar su perfil y proyectos públicos.
3. Usar `gh_aura_design_recommend`: petición → categoría → tres perfiles de referencia. Se pueden combinar estilos o elegir una categoría explícita.
4. Leer esos perfiles con las herramientas indicadas en `examples.readNext`; comparar bio, README, proyectos, enlaces y presentación. Consultar más ejemplos con `gh_aura_profiles_list` si hace falta. No copiar identidades, textos ni assets.
5. Componer una propuesta original y refinar el mismo ProfileSpec.
6. Mostrar cambios, ejecutar solo el plan autorizado y verificar cada operación.

El índice tiene ocho categorías y enlaces a perfiles, incluidas las ocho referencias originales. No carga un corpus ni impone principios prefabricados. Las fuentes se consultan al diseñar; si una referencia no responde, se usa otra. Markdown, medios y diseños fuera del índice siguen disponibles.

## Funciones

| Componente | Comportamiento |
| --- | --- |
| README | Composición original, estilos combinables, proyectos elegidos y assets autorizados; publicación inicial o modificación mediante PR/commit revisado |
| Bio y datos | Bio lateral de hasta 160 caracteres y cambios explícitos de los campos públicos soportados |
| Repositorios | Escaneo paginado, selección por objetivo, evidencia y propuestas de descripción/topics/README; pins preparados y comprobados, edición final mediante GitHub |
| Achievements | Ejercicios y campañas gratuitas viables, de una o dos identidades autorizadas, en workspace privado marcado; GitHub decide los premios |
| Contribuciones | Objetivos diarios y preview sobre el baseline observado, en el mismo workspace; GitHub determina atribución y colores |

## Implementación mínima

Node 22+, cero dependencias de ejecución. CLI, Skill, MCP y prompt portable comparten los handlers. El agente decide el diseño; el núcleo inspecciona, valida y ejecuta operaciones exactas. Los planes conservan destinos, contenido, presupuesto y revisión anterior; las escrituras inciertas se reconcilian antes de repetirse.

El propietario configura cualquier permiso de ejecución. El modelo no crea su propia autorización. Las fuentes externas son datos no confiables. La actividad sintética no se presenta como experiencia profesional.

## Comprobación y entrega

- `npm test`: comportamiento del producto, incluidos casos adversos.
- `npm run check`: sintaxis.
- `npm run test:package`: instalar y ejecutar offline el tarball, Skill y MCP.
- CI: Node 22/24 en Windows, macOS y Linux e integración pública de solo lectura.
- `npm run test:research`: comprobación opcional del archivo histórico, fuera del runtime.

La PR debe revisarse sobre su revisión final y pasar los checks antes de integrarse. Los pilotos de cuentas privadas quedan para el dueño, como indicó. Instalación/activación en clientes y resultados de usuarios se declaran únicamente cuando se hayan probado. No se prometen premios ni contrataciones.

[Uso completo](IMPROVE.md) · [Comandos](CLI.md) · [Arquitectura](ARCHITECTURE.md) · [Validación](RELEASE_READINESS.md)
