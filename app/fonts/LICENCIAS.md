# Fuentes alojadas en el propio proyecto (v1.10.0)

Desde la v1.10.0 DaiwaPlace ya **no pide ninguna fuente a Google** (ni en la compilación ni en el navegador):
todos los archivos `.woff2` de esta carpeta se sirven desde el mismo dominio, con caché larga e inmutable.
Son las versiones del subconjunto **latin** (el mismo que se pedía antes con `subsets: ['latin']`),
obtenidas de los paquetes `@fontsource` (que redistribuyen los archivos originales sin modificarlos).

Todas se publican bajo la **SIL Open Font License, Version 1.1** (https://openfontlicense.org), que permite usarlas,
incrustarlas y redistribuirlas en proyectos web, incluso comerciales, siempre que se conserve el aviso de copyright y
que la fuente no se venda por sí sola.

| Archivo                               | Familia           | Uso en DaiwaPlace                              | Aviso de copyright                                         |
| ------------------------------------- | ----------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Geist-latin-wght.woff2                | Geist (variable)  | Texto de toda la página (`--font-geist-sans`)  | Copyright 2024 The Geist Project Authors                   |
| GeistMono-latin-wght.woff2            | Geist Mono        | Código y estilo «máquina» (`--font-geist-mono`) | Copyright 2024 The Geist Project Authors                   |
| Cinzel-latin-wght.woff2               | Cinzel (variable) | Títulos (`font-display`, `--font-cinzel`)      | Copyright 2020 The Cinzel Project Authors                  |
| Anton-latin-400.woff2                 | Anton             | Textos de historias (`--font-anton`)           | Copyright 2020 The Anton Project Authors                   |
| Caveat-latin-700.woff2                | Caveat 700        | Textos de historias (`--font-caveat`)          | Copyright 2014 The Caveat Project Authors                  |
| PlayfairDisplay-latin-600-italic.woff2 | Playfair Display 600 cursiva | Textos de historias (`--font-playfair`) | Copyright 2017 The Playfair Display Project Authors        |
| Orbitron-latin-wght.woff2             | Orbitron (variable) | Reloj de las historias (`--font-orbitron`)   | Copyright 2018 The Orbitron Project Authors                |

Para añadir otra fuente: copia aquí su `.woff2`, declárala en `app/lib/fonts.ts` (o `storyFonts.ts`) con `next/font/local`
y anótala en esta tabla. No uses `next/font/google`: en Turbopack (Next 16) fue lo que rompió el despliegue en Vercel.
