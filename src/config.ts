import dotenv from "dotenv";
import { AppConfig } from "./types";

// Carga variables de .env
dotenv.config();

function parsePatterns(envValue: string | undefined, fallback: string[]): string[] {
  if (!envValue || envValue.trim() === "") {
    return fallback;
  }

  return envValue
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 0);
}

export function loadConfig(): AppConfig {
  const productUrl = process.env.PRODUCT_URL;
  if (!productUrl) {
    throw new Error("PRODUCT_URL no está definida en el .env");
  }

  const checkIntervalStr = process.env.CHECK_INTERVAL_MINUTES || "5";
  const checkIntervalMinutes = parseInt(checkIntervalStr, 10);

  if (Number.isNaN(checkIntervalMinutes) || checkIntervalMinutes <= 0) {
    throw new Error("CHECK_INTERVAL_MINUTES debe ser un número entero mayor que 0");
  }

  const outOfStockPatterns = parsePatterns(
    process.env.OUT_OF_STOCK_PATTERNS,
    ["agotado", "sin stock", "no disponible"]
  );

  const inStockPatterns = parsePatterns(
    process.env.IN_STOCK_PATTERNS,
    ["en stock", "disponible"]
  );

  const config: AppConfig = {
    productUrl,
    checkIntervalMinutes,
    outOfStockPatterns,
    inStockPatterns,
  };

  return config;
}