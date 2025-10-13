import app from "./app.mjs";

const PORT = process.env["PORT"] || 8000;

app.listen(PORT, () => {
    console.log(`Listenig on port ${PORT}`);
})
