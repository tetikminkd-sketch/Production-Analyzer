
'use server';

import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "@/lib/types";
import { Language } from "@/lib/i18n";

export async function generateInsights(data: AnalysisResult, language: Language = 'en') {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    return "Error: API Key is missing. Please check your environment variables.";
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const langName = language === 'tr' ? 'Turkish' : 'English';
  
  // Summarize data to avoid token limits if necessary, but for now send key metrics
  const summary = {
    overallEfficiency: data.overallEfficiency.toFixed(2),
    totalProductionTime: data.totalProductionTime.toFixed(2),
    totalUsedTime: data.totalUsedTime.toFixed(2),
    sheetCount: data.sheets.length,
    bestProject: data.bestProjectOverall?.projectName,
    bestProjectEff: data.bestProjectOverall?.efficiency.toFixed(2),
    sheets: data.sheets.map(s => ({
      name: s.sheetName,
      efficiency: s.totalEfficiency.toFixed(2),
      bestProject: s.bestProject?.projectName,
      worstProject: s.worstProject?.projectName
    }))
  };

  const prompt = `
    You are an Industrial Production Analysis AI. Analyze the following production data and provide a report in ${langName}.
    
    Data Summary:
    ${JSON.stringify(summary, null, 2)}

    Please generate the following sections in Markdown format:
    
    SECTION 1 – ${language === 'tr' ? 'Genel Özet' : 'Executive Summary'}
    - Summarize the overall performance.
    - Highlight key trends.

    SECTION 4 – ${language === 'tr' ? 'Risk ve Uyarılar' : 'Risks and Warnings'}
    - Identify efficiency drops (< 70%).
    - Flag high absenteeism or support usage if evident (based on general knowledge of industrial metrics).
    
    SECTION 5 – ${language === 'tr' ? 'İyileştirme Önerileri' : 'Improvement Recommendations'}
    - Suggest actionable steps to improve efficiency.
    
    SECTION 6 – ${language === 'tr' ? 'Grafik Açıklamaları' : 'Graph Explanations'}
    - Briefly explain what the charts (Efficiency Trend, Project Comparison) would show based on this data.

    Keep the tone professional, analytical, and direct.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating insights. Please try again.";
  }
}
