import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let genAiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      genAiClient = new GoogleGenAI({ apiKey });
    }
  }
  return genAiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API: AI Stock & Portfolio Analysis
  app.post("/api/ai-analysis", async (req, res) => {
    try {
      const { symbol, name, price, changePercent, portfolio, queryType } = req.body;
      const ai = getGenAI();

      if (!ai) {
        // Fallback rule-based analysis if Gemini key not configured
        const isPositive = (changePercent || 0) >= 0;
        const trend = isPositive ? "bullischer Aufwärtstrend" : "konsolidierende Korrektur";
        return res.json({
          success: true,
          provider: "built-in-heuristics",
          analysis: {
            title: `Marktanalyse für ${name || symbol || "Portfolio"}`,
            verdict: isPositive ? "Chancenreich / Übergewichten" : "Beobachten / Vorsichtig akkumulieren",
            summary: `${name || symbol} befindet sich aktuell in einer ${trend}-Phase. Für das simulierte Paper-Trading empfiehlt sich eine schrittweise Positionsaufteilung (Cost-Average-Effekt), um Kursrücksetzer abzufedern.`,
            keyFactors: [
              "Solide Marktstellung im jeweiligen Kernsegment",
              "Kurzfristige Volatilität bietet Einstiegs- und Trading-Chancen",
              "Makroökonomische Zinsdynamik im Auge behalten"
            ],
            riskLevel: Math.abs(changePercent || 0) > 3 ? "Mittel-Hoch (Erhöhte Volatilität)" : "Moderat",
            recommendation: isPositive ? "Position halten oder bei Dips zukaufen." : "Stop-Loss setzen und antizyklische Rebounds prüfen."
          }
        });
      }

      let prompt = "";
      if (queryType === "portfolio") {
        prompt = `Du bist ein erfahrener Börsenanalyst und Investmentberater für einen Aktien-Simulator.
Analysiere folgendes simuliertes Portfolio auf Deutsch:
${JSON.stringify(portfolio, null, 2)}

Antworte ausschließlich im validen JSON-Format mit folgenden Schlüsseln:
{
  "title": "Portfolio-Gesamtbewertung",
  "verdict": "Kurzes prägnantes Urteil (z.B. Ausgewogen & wachstumsorientiert)",
  "summary": "2-3 Sätze Gesamteindruck zur Diversifikation, Klumpenrisiken und Performance.",
  "keyFactors": ["3 prägnante Kernpunkte"],
  "riskLevel": "Niedrig | Moderat | Hoch",
  "recommendation": "Konkreter Handlungstipp für die nächsten Trades"
}`;
      } else {
        prompt = `Du bist ein präziser Finanzanalyst für einen Echtzeit-Aktiensimulator.
Analysiere die Aktie / den Wert ${name} (${symbol}), aktueller Kurs: ${price}€, heutige Veränderung: ${changePercent}%.
Verfasse die Analyse auf Deutsch.

Antworte ausschließlich im validen JSON-Format:
{
  "title": "KI-Analyse für ${name} (${symbol})",
  "verdict": "Kaufenswert | Halten | Beobachten | Risikoreich",
  "summary": "2-3 prägnante Sätze zu Geschäftsmodell, Marktlage und aktuellem Sentiment.",
  "keyFactors": ["3 wichtige Treiber oder Kennzahlen"],
  "riskLevel": "Niedrig | Moderat | Hoch",
  "recommendation": "Strategischer Tipp für Paper-Trader (z.B. Stop-Loss, Einstiegszone, Haltedauer)"
}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const responseText = response.text || "{}";
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          title: `Analyse für ${name || symbol || "Portfolio"}`,
          verdict: "Solide Marktposition",
          summary: responseText.slice(0, 300),
          keyFactors: ["Diversifikation beachten", "Trend beobachten"],
          riskLevel: "Moderat",
          recommendation: "Mit Limit-Orders handeln."
        };
      }

      return res.json({ success: true, provider: "gemini-3.8-flash", analysis: parsed });
    } catch (error: any) {
      console.warn("AI Analysis live call notice (falling back to built-in financial heuristics):", error?.message || error);
      const { symbol, name, price, changePercent } = req.body || {};
      const isPositive = (changePercent || 0) >= 0;
      const trend = isPositive ? "bullischer Aufwärtstrend" : "konsolidierende Korrektur";
      return res.json({
        success: true,
        provider: "built-in-heuristics",
        analysis: {
          title: `Marktanalyse für ${name || symbol || "Portfolio"}`,
          verdict: isPositive ? "Chancenreich / Übergewichten" : "Beobachten / Vorsichtig akkumulieren",
          summary: `${name || symbol || 'Das Portfolio'} befindet sich aktuell in einer ${trend}-Phase. Für das simulierte Paper-Trading empfiehlt sich eine schrittweise Positionsaufteilung (Cost-Average-Effekt), um Kursrücksetzer abzufedern.`,
          keyFactors: [
            "Solide Marktstellung im jeweiligen Kernsegment",
            "Kurzfristige Volatilität bietet Einstiegs- und Trading-Chancen",
            "Makroökonomische Zins- und Inflationsdaten beachten"
          ],
          riskLevel: Math.abs(changePercent || 0) > 3 ? "Mittel-Hoch (Erhöhte Volatilität)" : "Moderat",
          recommendation: isPositive ? "Position halten oder bei Dips schrittweise zukaufen." : "Stop-Loss setzen und antizyklische Rebounds prüfen."
        }
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
