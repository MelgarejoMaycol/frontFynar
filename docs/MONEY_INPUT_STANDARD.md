# Estándar de campos monetarios

## Regla

Todo valor de dinero visible y editable por una persona debe usar el componente global `MoneyInput`. Los importes de solo lectura deben usar el formateador financiero global; no deben implementar formato por pantalla.

## Presentación y entrada

- El formato visual es español/Colombia: `657.874,98` dentro del control y `$ 657.874,98` cuando el contexto muestra símbolo.
- Los formularios de Fynar activan `minorUnits`: los últimos dos dígitos escritos representan centavos. Por ejemplo, `9` → `0,09`, `987654` → `9.876,54` y `65787498` → `657.874,98`.
- `MoneyInput` mantiene el valor canónico separado de la presentación localizada.

## Contrato con la API

El payload siempre usa decimal canónico con punto y sin separadores de miles. Así, `657.874,98` se envía como `657874.98`. La base de datos conserva el tipo decimal definido por el dominio, no el texto localizado.

## Clasificación de controles

- Dinero editable: `MoneyInput` con `minorUnits`.
- Dinero de solo lectura: formateador global `money`/`formatMoney` correspondiente.
- Porcentaje o tasa: control porcentual o `Input` decimal; nunca `MoneyInput`.
- Cuotas, días y cantidades normales: `Input` numérico convencional.
- Fechas: controles de fecha, sin conversión monetaria.

## Prohibido

- Crear formatters monetarios locales o regex independientes por pantalla.
- Usar `Number()` directamente sobre texto localizado.
- Usar `type="number"` para dinero editable.
- Guardar valores como `657.874,98` en payloads o columnas financieras.
- Duplicar la normalización que ya proporciona `MoneyInput` y sus utilidades.

Al crear o revisar un formulario, el inventario de campos debe clasificar explícitamente cada cifra antes de elegir el control.
