# Editor de texto masivo

Herramienta web estatica para preparar listas SQL y editar bloques de texto. No necesita backend y puede publicarse directamente en GitHub Pages.

## Uso principal

1. Pega una columna de valores en `Entrada`.
2. Elige comillas simples, dobles o valores numericos.
3. Copia el resultado `IN (...)`.

La configuracion menos frecuente esta plegada en `Opciones avanzadas`. Los modulos de borrado masivo, backslash y ranking estan en `Mas herramientas`.

## Edicion multiple

- `Alt` + arrastrar: crea una seleccion rectangular en varias filas.
- `Ctrl+D` en Windows o `Cmd+D` en macOS: agrega la siguiente coincidencia a la seleccion.
- `Alt+F3`: selecciona todas las coincidencias del texto seleccionado.
- El campo `Buscar coincidencias` y el boton `Seleccionar todas` permiten editar todas las apariciones simultaneamente.
- `Un cursor` conserva solo el cursor principal.

## Abrir

Abre `index.html` en el navegador o sirve la carpeta con un servidor estatico.

## Dependencia incluida

El editor usa CodeMirror 5.65.16, distribuido bajo licencia MIT en `vendor/codemirror`.
