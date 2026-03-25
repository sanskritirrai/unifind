const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin@123", 
    database: "unifind"
});

db.connect(err => {
    if (err) console.log(err);
    else console.log("Connected to MySQL");
});

// TEST API
app.get("/", (req, res) => {
    res.send("Backend working 🚀");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;

    if (!email.endsWith("@krmu.edu.in")) {
        return res.send("Use university email");
    }

    db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, password],
        (err) => {
            if (err) return res.send("Error or Email exists");
            res.send("Signup successful");
        }
    );
});