import { describe, it, expect } from "vitest";
import { parseTcmbRate, tcmbProvider } from "../tcmb";
import { pickLatestFundPrice, tefasProvider } from "../tefas";
import {
  bistSymbol,
  cryptoSymbol,
  gramGoldFromOunce,
  yahooProvider,
} from "../yahoo";

const TCMB_XML = `<?xml version="1.0"?>
<Tarih_Date>
  <Currency CrossOrder="0" Kod="USD" CurrencyCode="USD">
    <Unit>1</Unit>
    <ForexBuying>32.10</ForexBuying>
    <ForexSelling>32.25</ForexSelling>
  </Currency>
  <Currency CrossOrder="9" Kod="JPY" CurrencyCode="JPY">
    <Unit>100</Unit>
    <ForexSelling>21.50</ForexSelling>
  </Currency>
</Tarih_Date>`;

describe("TCMB parseTcmbRate", () => {
  it("USD satış kurunu birim başına ayrıştırır", () => {
    expect(parseTcmbRate(TCMB_XML, "USD")).toBeCloseTo(32.25);
  });
  it("Unit'e böler (JPY 100 birim)", () => {
    expect(parseTcmbRate(TCMB_XML, "JPY")).toBeCloseTo(0.215);
  });
  it("olmayan kod null", () => {
    expect(parseTcmbRate(TCMB_XML, "XXX")).toBeNull();
  });
});

describe("TEFAS pickLatestFundPrice", () => {
  it("en güncel TARIH'in fiyatını seçer", () => {
    const rows = [
      { TARIH: 100, FONKODU: "AFT", FIYAT: 10 },
      { TARIH: 300, FONKODU: "AFT", FIYAT: 12 },
      { TARIH: 200, FONKODU: "AFT", FIYAT: 11 },
    ];
    expect(pickLatestFundPrice(rows)).toBe(12);
  });
  it("boş liste null", () => {
    expect(pickLatestFundPrice([])).toBeNull();
  });
});

describe("Yahoo sembol & altın yardımcıları", () => {
  it("BIST sembolü .IS ekler", () => {
    expect(bistSymbol("ASELS")).toBe("ASELS.IS");
    expect(bistSymbol("ASELS.IS")).toBe("ASELS.IS");
  });
  it("kripto sembolü -USD ekler", () => {
    expect(cryptoSymbol("BTC")).toBe("BTC-USD");
  });
  it("gram altın ons fiyatından hesaplanır", () => {
    // 3110.35 USD/ons, 32 ₺/USD → 100 USD/gram × 32 = 3200 ₺
    expect(gramGoldFromOunce(3110.35, 32)).toBeCloseTo(3200, 0);
  });
});

describe("provider supports yönlendirmesi", () => {
  it("fon → tefas", () => {
    expect(tefasProvider.supports({ ticker: "AFT", type: "fon", currency: "TRY" })).toBe(true);
    expect(tefasProvider.supports({ ticker: "ASELS", type: "hisse", currency: "TRY" })).toBe(false);
  });
  it("hisse/kripto/altın → yahoo", () => {
    expect(yahooProvider.supports({ ticker: "ASELS", type: "hisse", currency: "TRY" })).toBe(true);
    expect(yahooProvider.supports({ ticker: "BTC", type: "kripto", currency: "TRY" })).toBe(true);
    expect(yahooProvider.supports({ ticker: "XAU", type: "altin", currency: "TRY" })).toBe(true);
    expect(yahooProvider.supports({ ticker: "USD", type: "doviz", currency: "USD" })).toBe(false);
  });
  it("döviz → tcmb", () => {
    expect(tcmbProvider.supports({ ticker: "USD", type: "doviz", currency: "USD" })).toBe(true);
  });
});
