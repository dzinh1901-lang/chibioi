export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    app: "chibioi",
    version: "4.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
  });
}
