# Calcula tu Negocio — prototipo

App web para que pequeños emprendedores calculen sus costos, su precio, su punto de equilibrio y su meta de ahorro.

## Verla en línea

Este repositorio se publica con GitHub Pages: abre `https://TU-USUARIO.github.io/calcula-tu-negocio/` (reemplaza TU-USUARIO por tu nombre de usuario de GitHub).

## Cómo probarla en tu computadora

**Opción 1 (la más fácil):** descomprime la carpeta y haz doble clic en `index.html`. Se abre en tu navegador.

**Opción 2 (como un servidor local):** abre una terminal dentro de la carpeta y ejecuta uno de estos comandos:

- Con Python: `python -m http.server 8000`
- Con Node.js: `npx serve`

Luego entra a `http://localhost:8000` (o a la dirección que muestre `npx serve`).

**Para probarla en tu celular:** con la opción 2, conecta el celular a la misma red wifi y entra a `http://IP-DE-TU-PC:8000`.

## Cómo usarla

1. Toca **Ver ejemplo** para cargar el caso de doña Rosa (puesto de menú).
2. Avanza por los 4 pasos: Mis costos, Mi precio, Equilibrio y Mi meta.
3. Toca **Empezar de cero** (dos veces) para borrar todo y probar con tus propios datos.

Los datos se guardan solo en tu navegador. No se envían a ningún servidor.

## Novedades de la versión 3

- **Gráfico plegable (paso 3):** el gráfico de ingresos y costos está cerrado por defecto y se abre con el botón «Gráfico de ingresos y costos».
- **Espacios publicitarios de ejemplo:** cuatro anuncios de muestra (pasos 2, 3 y 4, y lateral), marcados como «Publicidad». Las marcas son ficticias.
- **Simulador de crédito (paso 4):** cuota, total pagado, intereses y semáforo de capacidad de pago (cuota frente a la ganancia del mes), comparado con ahorrar.
- **Solicitud de asesoría:** botón «Quiero que me contacten» con consentimiento según la Ley N.° 29733. En esta demostración no se envía ni se guarda ningún dato.
- **Resumen en PDF:** botón «Guardar mi resumen en PDF» que imprime una hoja con todos los resultados.
- **Versión para entidades (marca blanca):** abre `index.html?entidad=demo` para ver la app con la marca ficticia «Caja Demo», sin anuncios. Para una entidad real se completa `CONFIG.entidad` en `app.js`.
- **Página para bancos y cajas:** `entidades.html` explica la propuesta de valor, los modelos de venta y el boceto de los espacios publicitarios.

## Novedades de la versión 2

- **Plano interactivo (paso 3):** funciona como GeoGebra. Toca o pasa el mouse para leer cuánto cobras, gastas y ganas en cualquier cantidad. Arrastra para moverte, haz zoom con la rueda del mouse, dos dedos o los botones, y cambia entre **Por día** y **Por mes**. Debajo hay una **tabla de valores**; al tocar una fila, el punto se ubica en el plano.
- **Paso 4 más claro:** eliges dónde guardas tu ahorro (en casa 0 %, banco grande 1 %, caja municipal 4 % u otra tasa). Además, ves cuánto ponen los intereses, una comparación entre opciones y tu ahorro mes por mes.

## Archivos

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | La estructura de las 4 pantallas |
| `styles.css` | El diseño (cuaderno cuadriculado y tinta azul) |
| `app.js` | Las fórmulas y la lógica de la app |
| `entidades.html` | Página de presentación para bancos, cajas y financieras |

## Fórmulas que usa (ver `app.js`)

- Costo fijo (CF) = suma de gastos fijos + sueldo propio
- Costo variable por unidad (CVu) = suma de gastos por unidad
- Cantidad al mes (Q) = ventas por día × días trabajados
- Beneficio = P × Q − (CF + CVu × Q)
- Costo medio = costo total ÷ Q
- Punto de equilibrio = CF ÷ (P − CVu)
- Ahorro mensual = Meta × i ÷ ((1 + i)^n − 1), con i = (1 + tasa anual)^(1/12) − 1

## Reglas del semáforo

- **Rojo:** el precio no cubre el costo por unidad.
- **Amarillo:** cubre el costo por unidad, pero no el costo medio.
- **Verde:** el precio supera el costo medio.

La fuente (Atkinson Hyperlegible) se descarga de Google Fonts. Sin internet, la app funciona igual con la fuente del sistema.
