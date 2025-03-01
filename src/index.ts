import express from "express";
import { scrapePage } from "./scraper";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = 3000;

app.use(express.json());

app.post("/scrape", async (req, res): Promise<any> => {
  try {
    const { url, lang } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const socketId = req.headers["socket-id"] as string | undefined;
    await scrapePage(url, lang, io, socketId);

    return res.status(200).json({ message: "Scraping started successfully" });
  } catch (error) {
    console.error("Scraping failed:", error);
    return res
      .status(500)
      .json({ error: "Scraping failed due to an internal error" });
  }
});

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
