import { GoogleGenerativeAI } from "@google/generative-ai";

export default class API {
  constructor(app) {
    this.app = app;
    this.setupEndpoints();
  }

  async setupEndpoints() {
    this.getUserTable();
    this.geminiPrompt();
  }

  async getUserTable() {
    this.app.get("/", (req, res) => {
      
    });
  }

  async geminiPrompt(){
    this.app.get("/api/ai_abstract", async (req, res) => {
      const AUTHOR = req.query.author;
      const TITLE = req.query.title;
      const GEN_AI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const MODEL = GEN_AI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const PROMPT = `Provide a 20-30 word abstract for the Book ${TITLE} by ${AUTHOR}`;
      const RESULT = await MODEL.generateContent(PROMPT);
      const TEXT = RESULT.response.candidates[0].content.parts[0].text;
    
      return res.send(TEXT);
    });
  }
}
