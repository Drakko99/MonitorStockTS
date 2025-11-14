// src/scraper.ts
import axios from "axios";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import type { AppConfig, CheckResult } from "./types";

// ¿Esta URL es de AliExpress?
function isAliExpress(url: string): boolean {
  return url.includes("aliexpress.com");
}

// Texto "relevante" usando HTML estático (axios + cheerio)
function getRelevantTextStatic(config: AppConfig, html: string): string {
  const url = config.productUrl.toLowerCase();
  const $ = cheerio.load(html);
  let text = "";

  // Caso especial: Amazon
  if (url.includes("amazon.")) {
    const availability =
      $("#availability").text() ||
      $("#availability_feature_div").text() ||
      $("#outOfStock").text();

    if (availability && availability.trim().length > 0) {
      text = availability;
    }
  }

  // Otros sitios (Instant Gaming, etc.): usamos todo el body
  if (!text.trim()) {
    text = $("body").text();
  }

  return text.toLowerCase().replace(/\s+/g, " ");
}

// Texto usando navegador real (Playwright) – para AliExpress
async function getRelevantTextWithBrowser(config: AppConfig): Promise<string> {
  console.log("Usando navegador headless (Playwright) para:", config.productUrl);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(config.productUrl, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });

  // Pequeña espera extra por si la página tarda en pintar
  await page.waitForTimeout(3000);

  const bodyText = (await page.textContent("body")) ?? "";

  await browser.close();

  return bodyText.toLowerCase().replace(/\s+/g, " ");
}

// Evalúa el texto y decide si hay stock
function evaluateText(textToCheck: string, config: AppConfig): {
  inStock: boolean;
  matchingOut: string[];
  matchingIn: string[];
} {
  const matchingOut = config.outOfStockPatterns.filter((pat) =>
    textToCheck.includes(pat.toLowerCase())
  );
  const matchingIn = config.inStockPatterns.filter((pat) =>
    textToCheck.includes(pat.toLowerCase())
  );

  console.log("Patrones SIN stock encontrados:", matchingOut);
  console.log("Patrones CON stock encontrados:", matchingIn);

  let inStock = false;

  if (matchingOut.length === 0 && matchingIn.length === 0) {
    // No sabemos nada -> conservador: asumimos SIN stock
    inStock = false;
  } else if (matchingOut.length > 0 && matchingIn.length === 0) {
    inStock = false;
  } else if (matchingIn.length > 0 && matchingOut.length === 0) {
    inStock = true;
  } else {
    // Se ven frases de ambos tipos -> gana SIN stock
    inStock = false;
  }

  return { inStock, matchingOut, matchingIn };
}

export async function checkProductStock(config: AppConfig): Promise<CheckResult> {
  const urlLower = config.productUrl.toLowerCase();

  let textToCheck: string;

  if (isAliExpress(urlLower)) {
    // AliExpress: usar siempre navegador headless
    textToCheck = await getRelevantTextWithBrowser(config);
  } else {
    // Resto: HTML estático
    const response = await axios.get(config.productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    const html = response.data as string;
    textToCheck = getRelevantTextStatic(config, html);
  }

  const { inStock } = evaluateText(textToCheck, config);

  const result: CheckResult = {
    inStock,
    checkedAt: new Date(),
    rawTextSample: textToCheck.slice(0, 500),
  };

  return result;
}
