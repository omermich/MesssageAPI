const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const users = [
    {
        name: "omer"
        
    }
]

app.get("/api/send/:sender/:recipient/:date", (req, res) => {
    title = req.query.title;
    content = req.query.content;
    if (title === undefined) title = "<empty>"
    if (content === undefined) content = "<empty>"
    res.send(req.params);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
