import { loadConfig } from "./config";
import { checkProductStock } from "./scraper";
import { notifyInStock } from "./notifier";
import { CheckResult } from "./types";

async function main() {
  const config = loadConfig();

  console.log("========================================");
  console.log(" Iniciando stock-watcher ");
  console.log("========================================");
  console.log(`Producto: ${config.productUrl}`);
  console.log(`Intervalo: ${config.checkIntervalMinutes} minuto(s)`);
  console.log(
    `Patrones SIN stock: ${config.outOfStockPatterns.join(", ") || "(ninguno)"}`
  );
  console.log(
    `Patrones CON stock: ${config.inStockPatterns.join(", ") || "(ninguno, se usa inverso)"}`
  );
  console.log("========================================\n");

  let lastResult: CheckResult | null = null;

  async function runCheck() {
    try {
      console.log(`[${new Date().toLocaleString()}] Comprobando stock...`);

      const result = await checkProductStock(config);

      console.log(
        `Resultado: ${result.inStock ? "EN STOCK ✅" : "SIN STOCK ❌"}`
      );

      // Solo notificamos si:
      // - Ya teníamos un resultado previo
      // - Y antes estaba sin stock y ahora en stock
      if (lastResult && !lastResult.inStock && result.inStock) {
        await notifyInStock(config, result);
      }

      // Guardamos el último resultado para comparar en la siguiente vuelta
      lastResult = result;
    } catch (error) {
      console.error("❌ Error al comprobar stock:", error);
    }

    console.log("");
  }

  // Ejecutamos una vez al iniciar
  await runCheck();

  // Y luego cada X minutos
  const intervalMs = config.checkIntervalMinutes * 60 * 1000;
  setInterval(runCheck, intervalMs);
}

// Lanzamos el script
main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
