export interface AppConfig {
  productUrl: string;
  checkIntervalMinutes: number;
  outOfStockPatterns: string[];
  inStockPatterns: string[];
}

export interface CheckResult {
  inStock: boolean;
  checkedAt: Date;
  rawTextSample: string;
}
