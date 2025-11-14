import { AppConfig, CheckResult } from "./types";

export async function notifyInStock(config: AppConfig, result: CheckResult): Promise<void> {
  // Aquí puedes sustituir esto por:
  // - Enviar un email (nodemailer)
  // - Enviar mensaje a Telegram/Discord
  // - Notificación push, etc.

  console.log("========================================");
  console.log("🎉 ¡EL PRODUCTO HA VUELTO A ESTAR EN STOCK!");
  console.log(`URL: ${config.productUrl}`);
  console.log(`Hora: ${result.checkedAt.toLocaleString()}`);
  console.log("========================================");
}
