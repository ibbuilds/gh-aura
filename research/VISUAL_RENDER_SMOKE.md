# GH Aura — comprobación técnica del perfil en cuatro vistas

La prueba de navegador complementa la investigación de [600 cuentas](profile-candidates-600.json), [561 perfiles públicos recuperados](holistic-public-observations-summary.json), [HTML público y achievements](html-facets) y la [clasificación preliminar](HOLISTIC_CATEGORY_TRIAGE.md).

## Resultado verificado de la prueba masiva

Las 12 ejecuciones de navegador, realizadas sobre el conjunto completo de 600 candidatos, dieron estos resultados:

| Resultado | Cuentas |
| --- | ---: |
| Intentos documentados | **600** |
| Capturas válidas en los cuatro modos | **562** |
| Capturas no conseguidas | **38** |
| Diferencia claro/oscuro confirmada por CSS | **562** |
| Viewports de escritorio/móvil correctos | **562** |
| Indicadores de desbordamiento horizontal del documento en el primer encuadre | **0** |
| Cuentas con al menos una imagen visible que no terminó de cargar | **91** |
| De esas 91, clasificadas provisionalmente como dashboard | **64** |
| Auditorías editoriales completas | **0** |
| Ganadores aprobados | **0** |

Datos y casos individuales: [resumen de los 600](visual-render-smoke-summary.json) y [12 lotes con huellas SHA-256](render-smokes).

Una captura exitosa **no valida** todo el diseño. Los 91 avisos incluyen posibles fallos de CDN, widgets externos y cargas diferidas; requieren comprobar el navegador y recurso específico antes de concluir que algo está roto. La categoría dashboard tiene más advertencias que otros estilos y debe ser revisada antes de considerar estas métricas como recursos profesionales recomendados por defecto. Ningún valor representa calidad de programación o resultados de contratación.

## Qué se comprueba realmente

El script `scripts/visual-profile-smoke.mjs` abre únicamente páginas públicas de GitHub en Chromium local y, para cada cuenta, intenta capturar el **primer encuadre** en cuatro combinaciones:

| Vista | Resolución emulada | Tema |
| --- | --- | --- |
| desktopLight | 1200 × 920 | claro |
| desktopDark | 1200 × 920 | oscuro |
| mobileLight | 390 × 844 | claro |
| mobileDark | 390 × 844 | oscuro |

Registra si la página respondió con un perfil reconocible, el éxito de la captura, las dimensiones reales del viewport, color de fondo, desbordamiento horizontal, cantidad de imágenes visibles sin cargar y el **hash SHA-256** del JPEG generado.

**No se guarda ningún screenshot o fotografía en el repositorio.** El HTML remoto se utiliza solo para el diagnóstico, sin guardar biografías completas, textos personales ni credenciales. Los PNG/JPEG se descartan después de calcular sus huellas. Este script no necesita un token, no escribe en cuentas GitHub y no es parte del CLI distribuido.

El informe agregado `visual-render-smoke-summary.json` y los lotes `render-smokes/batch-XXX.json` permiten repetir el análisis y localizar problemas observables.

## Qué NO demuestra

- El hecho de que se capture la pantalla no prueba **calidad de diseño**, contraste accesible, licencia de una imagen ni veracidad de un logro.
- Se estudia el primer encuadre, no toda la altura del README ni el comportamiento de elementos interactivos.
- Los tamaños de móvil y los temas son emulados, no se ha probado un dispositivo real ni se han realizado entrevistas a usuarios.
- GitHub carga algunas imágenes de forma diferida; un elemento no visible en pantalla puede no estar cargado todavía.
- La ausencia del README o de badges en un extracto no demuestra que estén ausentes del perfil.
- El número de commits, estrellas o achievements no equivale a competencia técnica o profesional.
- Ninguna prueba automatizada decide quién es «el mejor» dentro de una categoría.

## Selección editorial

La selección previa de 25 sigue siendo un **piloto de README**, no 25 ganadores entre 500 perfiles completos. La [cola editorial](holistic-editorial-review-template.json) exige observación integral de avatar, cabecera, biografía, enlaces, README renderizado, pins, mapa de contribuciones, achievements y composición total, con registros de claro/oscuro y escritorio/móvil.

Para aprobar un patrón o un ganador de categoría, una persona debe inspeccionar la página, verificar el contexto de proyectos, accesibilidad, derechos de imágenes y compararla con alternativas de su mismo estilo. Estas conclusiones no se infieren del script.

El [issue #69](https://github.com/ibbuilds/gh-aura/issues/69) mantiene abierta la revisión integral de 500 cuentas hasta completar las evidencias exigidas.

## Ejecución de desarrollo

```bash
node scripts/visual-profile-smoke.mjs \
  --input research/graphql-observations/batch-000.json \
  --start 0 --limit 50 --output /tmp/visual-smoke-000.json
```

Se necesita Chrome o Chromium local, además de Node.js 22+. `GH_AURA_CHROME` permite escoger el ejecutable del navegador. El fichero de salida debe ser nuevo; el script no sobrescribe resultados previos. La recolección debe ejecutarse de forma acotada y respetando las restricciones de GitHub.
