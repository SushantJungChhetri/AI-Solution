import express, { Request, Response } from "express";
import cors from "cors";
import { query } from "../src/db.js";


const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://vite-react-typescript-starter.vercel.app"],
    credentials: true,
  })
);

app.get("/health/db", async (_req: Request, res: Response) => {
  try {
    const r = await query("select now() as now");
    const now = (r as { rows: Array<{ now: string }> }).rows?.[0]?.now;
    res.json({ ok: true, now });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message ?? String(e) });
  }
});

export default app; // no app.listen()
