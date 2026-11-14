# Referencias de diseño

La investigación sirve para encontrar ejemplos, no para añadir un corpus al producto.

1. `gh-aura sources categories --json` muestra las ocho categorías.
2. `gh-aura sources profiles --category terminal-code --json` devuelve perfiles concretos.
3. La IA consulta esos perfiles y compone un diseño original para el usuario. `sources design --query "terminal sobrio" --json` selecciona categoría, ejemplos y técnicas compatibles en una llamada.

El índice compacto vive en [profile-patterns.mjs](../src/profile-patterns.mjs). Conserva las ocho referencias originales y admite categorías secundarias. Los enlaces son referencias de lectura; no otorgan derechos sobre textos, imágenes o credenciales. El estado actual se comprueba al utilizarlos.

Los datasets, recolectores y reportes históricos permanecen recuperables en el commit [d978bbae0234b30390885fc17bb7f2b6d52bc21b](https://github.com/ibbuilds/gh-aura/tree/d978bbae0234b30390885fc17bb7f2b6d52bc21b/research). `npm run test:research` verifica ese archivo temporalmente, sin red, sin añadirlo al paquete y retirando su exportación. En un clon que no tenga el checkpoint:

    git fetch origin d978bbae0234b30390885fc17bb7f2b6d52bc21b

El corpus de análisis por IA se conserva localmente por decisión del dueño y no interviene en la generación de perfiles.
