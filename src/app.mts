import express from "express"

const app = express();

app.get("/", (_, res) => {
    res.status(200).send("Ok");
})

export default app;

