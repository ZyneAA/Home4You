// Locals
import app from "./app.mjs";
import logger from "./config/logger.mjs";

const PORT = process.env["PORT"] || 8000;

app.listen(PORT, () => {
    logger.info(`Server started on localhost:${PORT}`);
});
