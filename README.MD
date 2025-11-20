# MonitorStockTS

Script sencillo en **TypeScript** para **vigilar el stock de un producto a partir de su URL**.  
Cada cierto tiempo descarga la página, analiza su contenido y busca frases configurables que indiquen:

- que **NO** hay stock (por ejemplo: `agotado`, `sin stock`, `no disponible`), o  
- que **SÍ** hay stock (por ejemplo: `en stock`, `disponible`, `Add to cart`).

Cuando detecta un cambio de estado **de sin stock ➜ a en stock**, muestra una notificación por consola.

---

## 🧩 Características principales

- ✅ Escrito en **TypeScript** para **Node.js** (CommonJS).
- 🔁 Comprueba el stock cada **X minutos**, configurable desde `.env`.
- 🧠 Detección basada en **patrones de texto** (listas de frases configurables).
- 🌐 Scraping adaptado a distintos tipos de sitios:
  - **HTML estático**: utiliza `axios` + `cheerio` para la mayoría de webs.
  - **AliExpress**: usa **Playwright (Chromium headless)** para cargar la página completa.
  - **Amazon**: intenta leer específicamente la sección de disponibilidad.
- 🔔 Solo notifica cuando hay un cambio de **SIN stock ➜ EN stock** para evitar spam.
- 🛠 Arquitectura pensada para extender el sistema de notificaciones  
  (email, Telegram, Discord, push, etc., cambiando solo un archivo).

---

## 📦 Requisitos

- **Node.js** ≥ 18 (recomendado LTS).
- **npm** (o gestor compatible).
- Dependencias del sistema necesarias para que **Playwright** pueda lanzar Chromium.  
  - En Linux puede requerir librerías adicionales.  
  - En Windows y macOS suele funcionar sin configuración extra.

---

## 🚀 Instalación

1. Clona el repositorio y entra en la carpeta:

   ```bash
   git clone https://github.com/Drakko99/MonitorStockTS
   cd MonitorStockTS
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

---

## ⚙️ Configuración

Copia el archivo de ejemplo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con los valores que quieras:

```dotenv
# URL del producto a vigilar
PRODUCT_URL=https://ejemplo.com/mi-producto

# Cada cuántos minutos comprobar (entero)
CHECK_INTERVAL_MINUTES=60

# Palabras/frases que indican que NO hay stock (separadas por comas)
OUT_OF_STOCK_PATTERNS=agotado,sin stock,no disponible,Out of stock, Get notified by e-mail on stock availability

# Palabras/frases que indican que SÍ hay stock (separadas por comas)
IN_STOCK_PATTERNS=en stock,disponible,Add to cart,In stock, Comprar ya, Comprar, Agregar al carrito
```

### Variables disponibles

| Variable                 | Obligatoria | Por defecto                       | Descripción                                                              |
| ------------------------ | ----------: | --------------------------------- | ------------------------------------------------------------------------ |
| `PRODUCT_URL`            |           ✅ | *(ninguno)*                       | URL del producto a monitorizar.                                          |
| `CHECK_INTERVAL_MINUTES` |           ❌ | `5`                               | Intervalo en minutos entre comprobaciones. Debe ser un entero > 0.       |
| `OUT_OF_STOCK_PATTERNS`  |           ❌ | `agotado,sin stock,no disponible` | Frases que indican que **no** hay stock (separadas por comas).           |
| `IN_STOCK_PATTERNS`      |           ❌ | `en stock,disponible`             | Frases que indican que **sí** hay stock (separadas por comas).           |

> Todos los patrones se convierten internamente a minúsculas y se buscan como **subcadenas** dentro del texto de la página.

---

## ▶️ Ejecución

### Modo desarrollo (TypeScript directamente)

Para ejecutar el script sin compilar, usando `ts-node`:

```bash
npm run dev
```

### Modo producción (JavaScript compilado)

1. Compila el proyecto:

   ```bash
   npm run build
   ```

2. Ejecuta el código compilado:

   ```bash
   npm start
   ```

---

## 📝 Ejemplo de uso

### 1. Configura la URL y los patrones

Por ejemplo, para vigilar un producto en una tienda online:

```dotenv
PRODUCT_URL=https://tienda-ejemplo.com/producto/abc123
CHECK_INTERVAL_MINUTES=15
OUT_OF_STOCK_PATTERNS=agotado,sin stock,no disponible,Out of stock
IN_STOCK_PATTERNS=en stock,disponible,Add to cart
```

Después:

```bash
npm install
npm run dev
```

### 2. Ejemplo de salida en consola

Al iniciar, verás algo similar a:

```text
========================================
 Iniciando stock-watcher
========================================
Producto: https://tienda-ejemplo.com/producto/abc123
Intervalo: 15 minuto(s)
Patrones SIN stock: agotado, sin stock, no disponible, out of stock
Patrones CON stock: en stock, disponible, add to cart
========================================

[14/11/2025 10:00:00] Comprobando stock...
Patrones SIN stock encontrados: [ 'sin stock' ]
Patrones CON stock encontrados: []
Resultado: SIN STOCK ❌
```

Cuando el producto pase a estar disponible en una comprobación posterior:

```text
[14/11/2025 10:15:00] Comprobando stock...
Patrones SIN stock encontrados: []
Patrones CON stock encontrados: [ 'en stock', 'add to cart' ]
Resultado: EN STOCK ✅
========================================
🎉 ¡EL PRODUCTO HA VUELTO A ESTAR EN STOCK!
URL: https://tienda-ejemplo.com/producto/abc123
Hora: 14/11/2025 10:15:02
========================================
```

El mensaje de celebración se muestra **solo cuando se detecta un cambio** de  
“antes sin stock” ➜ “ahora en stock”.

---

## 🧱 Arquitectura interna (resumen)

1. **Configuración** – `src/config.ts`  
   - Carga las variables de entorno desde `.env` usando `dotenv`.
   - Valida que `PRODUCT_URL` exista y que `CHECK_INTERVAL_MINUTES` sea un entero > 0.
   - Convierte `OUT_OF_STOCK_PATTERNS` e `IN_STOCK_PATTERNS` en arrays normalizados (minúsculas).

2. **Scraping** – `src/scraper.ts`  
   - Si la URL contiene `aliexpress.com`, usa **Playwright** (Chromium headless) para cargar la página completa y extraer el texto del `<body>`.
   - Si no es AliExpress:
     - Usa `axios` para hacer el `GET` de la página.
     - Usa `cheerio` para parsear el HTML.
     - Si la URL es de **Amazon**, intenta leer elementos típicos de disponibilidad (`#availability`, etc.).
     - En otros casos, toma el texto completo del `<body>`.
   - Normaliza el texto (minúsculas, espacios).
   - Busca coincidencias de patrones de **SIN stock** y **CON stock** y aplica la lógica:
     - Sin coincidencias ➜ se asume **SIN stock** (enfoque conservador).
     - Solo patrones de SIN stock ➜ **SIN stock**.
     - Solo patrones de CON stock ➜ **EN stock**.
     - Ambos tipos a la vez ➜ prevalece **SIN stock**.

3. **Bucle de comprobación** – `src/index.ts`  
   - Muestra por consola la configuración inicial.
   - Ejecuta una primera comprobación inmediata.
   - Configura un `setInterval` para repetir la comprobación cada `CHECK_INTERVAL_MINUTES`.
   - Guarda el último estado y compara:
     - Si antes no había stock y ahora sí ➜ llama a `notifyInStock`.

4. **Notificación** – `src/notifier.ts`  
   - Actualmente, simplemente imprime un mensaje por consola indicando que el producto ha vuelto a estar en stock.
   - Es el punto de extensión ideal para integrar:
     - Envío de emails.
     - Mensajes a Telegram/Discord.
     - Notificaciones push, etc.

---

## 🔔 Personalización de notificaciones

La función que se encarga de avisar cuando hay stock es:

```ts
// src/notifier.ts
export async function notifyInStock(config: AppConfig, result: CheckResult): Promise<void> {
  console.log("========================================");
  console.log("🎉 ¡EL PRODUCTO HA VUELTO A ESTAR EN STOCK!");
  console.log(`URL: ${config.productUrl}`);
  console.log(`Hora: ${result.checkedAt.toLocaleString()}`);
  console.log("========================================");
}

## ⚠️ Limitaciones y buenas prácticas

- Evita intervalos de comprobación demasiado bajos  
  (por ejemplo, cada pocos segundos) para no abusar del servidor.
- Páginas con **CAPTCHA**, protecciones anti-bot o restricciones regionales pueden no funcionar correctamente.

---