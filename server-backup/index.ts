import "dotenv/config"; // ← PRIMERA línea, antes de cualquier otro import
import { prisma } from "./lib/prisma";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import cameraRoutes from "./routes/camera.routes";
import projectRoutes from "./routes/project.routes";
import weatherRoutes from "./routes/weather.routes";
import aiRoutes from "./routes/ai.routes";
import alertRoutes from "./routes/alert.routes";
import teamRoutes from "./routes/team.routes";
import subscriptionRoutes from "./routes/subscription.routes";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use("/api/subscriptions/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", weatherRoutes);
app.use("/api/projects", aiRoutes);
app.use("/api/projects", alertRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
