const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res)=> {
    res.sendFile(path.join(__dirname, "client", "index.html"));
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`FlyChat Server running on http://localhost:${PORT}`);
})