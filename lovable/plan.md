# Croquis aéreo + Estimado en PDF para MetalFlow

## Objetivo
Cuando un cliente completa la Opción 2 (Get your quote) con su dirección, el sistema busca esa casa por satélite y guarda una vista aérea. En /admin el asesor abre la solicitud, dibuja el croquis del techo sobre la foto aérea, escribe medidas, ajusta el estimado y descarga un PDF de una sola hoja con la identidad de MetalFlow.

## Flujo
```text
Cliente (Opción 2)            Sistema                        Asesor en /admin
dirección + ciudad  ->  geolocaliza la casa        ->  abre la solicitud
pies, bajantes, total   guarda vista aérea             dibuja líneas de canal
                                                       escribe medidas y notas
                                                       edita totales y opciones
                                                       descarga el PDF (1 hoja)
```

## Qué se construye

### 1. Vista aérea automática
- Se conecta Google Maps Platform (gestionado por Lovable) para geolocalizar la dirección y traer la imagen satelital de alta resolución de la casa.
- Al guardar la solicitud (Opción 2 y también el formulario de contacto cuando hay dirección), el sistema busca las coordenadas y guarda la imagen aérea de esa casa.
- Si la dirección no se encuentra, la solicitud se guarda igual y el asesor puede ajustar la ubicación a mano o subir su propia captura.

### 2. Editor de croquis en /admin
- La foto aérea se muestra en un lienzo. El asesor puede:
  - Dibujar líneas de canal sobre el contorno del techo (clic a clic, como el ejemplo).
  - Marcar puntos de bajante.
  - Escribir la medida de cada tramo (por ejemplo 60, 25, 20) que se muestra sobre la línea.
  - Borrar el último trazo o limpiar todo, y acercar o alejar la imagen.
- Todo el croquis se guarda en la solicitud para poder retomarlo después.

### 3. Formulario de estimado editable
Se carga automáticamente con lo que ya dio el cliente y todo es editable:
- Fecha, nombre, teléfono, correo, dirección y ciudad.
- Estilo (K Style, Square, Flat Face) y tamaño (5, 6, 7, 8).
- Pies lineales, cantidad de bajantes, bajantes de doble y triple nivel.
- Leaf Guard sí o no, total, depósito y notas internas.
- Renglones libres para servicios adicionales por si el asesor quiere sumar algo.

### 4. PDF de una hoja
- Hoja tamaño carta con encabezado MetalFlow (logo, teléfono, correo, sitio, Licensed and insured, Pompano Beach).
- Bloque de datos del cliente y del servicio.
- El croquis grande al centro, con las medidas dibujadas.
- Resumen del trabajo: estilo, tamaño, pies, bajantes, Leaf Guard.
- Total y depósito destacados, nota de que el precio incluye materiales, hangers, tornillos y desperdicio, línea de firma.
- Sin números de licencia y sin guiones, siguiendo el estilo actual de la web.
- Se descarga desde el navegador con un botón, sin salir de /admin.

## Detalles técnicos
- Conector Google Maps Platform: geocoding y Static Maps por el gateway desde una server function autenticada, nunca desde el navegador.
- Nuevas columnas en la solicitud: coordenadas, ruta de la imagen aérea, croquis en JSON y campos del estimado en JSON. La imagen se guarda en el bucket privado existente y se lee con URL firmada.
- El croquis se dibuja con SVG sobre la imagen, así las líneas y medidas quedan nítidas en el PDF.
- El PDF se genera con una hoja de impresión dedicada y el diálogo de guardar como PDF del navegador, para mantener texto vectorial y cero dependencias nuevas pesadas.
- Los precios base y del Leaf Guard se siguen tomando de la pestaña Pricing de /admin.
