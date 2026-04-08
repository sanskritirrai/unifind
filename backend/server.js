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

const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

// TEST API
app.get("/", (req, res) => {
    res.send("Backend working 🚀");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.post("/login", (req,res)=>{
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email=?", [email], async (err,result)=>{
        if(result.length === 0){
            return res.json({});
        }

        const user = result[0];

        const bcrypt = require("bcrypt");
        const match = await bcrypt.compare(password, user.password);

        if(match){
            res.json(user);
        } else {
            res.json({});
        }
    });
});


app.get("/notifications/:userId", (req,res)=>{
    const userId = req.params.userId;

    db.query(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC",
        [userId],
        (err,result)=>{
            res.json(result);
        }
    );
});

app.post("/lost", (req,res)=>{
    const { user_id, item_name, category, description, location, date_lost } = req.body;

    db.query(
        "INSERT INTO lost_items (user_id,item_name,category,description,location,date_lost) VALUES (?,?,?,?,?,?)",
        [user_id,item_name,category,description,location,date_lost],
        (err)=>{
            if(err) return res.send("Error");
            res.send("Lost item added");
        }
    );
});

app.post("/found", (req,res)=>{
    const { user_id, item_name, category, description, location, date_found } = req.body;

    db.query(
        "INSERT INTO found_items (user_id,item_name,category,description,location,date_found) VALUES (?,?,?,?,?,?)",
        [user_id,item_name,category,description,location,date_found],
        (err)=>{
            if(err) return res.send("Error");
            res.send("Found item added");
        }
    );
});

app.get("/items", (req,res)=>{
    db.query(`
        SELECT item_name, category, location, status FROM lost_items
        UNION
        SELECT item_name, category, location, status FROM found_items
    `, (err,result)=>{
        res.json(result);
    });
});

app.post("/report-lost", upload.single("image"), (req,res)=>{
    const { user_id, item_name, category, description, location, date_lost } = req.body;

    const image = req.file ? req.file.filename : null;

    db.query(
        "INSERT INTO lost_items (user_id,item_name,category,description,location,date_lost,status,image) VALUES (?,?,?,?,?,?,?,?)",
        [user_id,item_name,category,description,location,date_lost,"Pending", image],
        (err)=>{
            if(err){
                console.log(err);
                return res.send("Error");
            }

            db.query(
                "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
                [user_id, `Lost item "${item_name}" reported successfully`]
            );

            res.send("Lost item added");
        }
    );
});

app.post("/report-found", upload.single("image"), (req,res)=>{
    const { user_id, item_name, category, description, location, date_found } = req.body;

    const image = req.file ? req.file.filename : null;

    db.query(
        "INSERT INTO found_items (user_id,item_name,category,description,location,date_found,status,image) VALUES (?,?,?,?,?,?,?,?)",
        [user_id,item_name,category,description,location,date_found,"Pending", image],
        (err)=>{
            if(err){
                console.log(err);
                return res.send("Error");
            }

            db.query(
                "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
                [user_id, `Found item "${item_name}" reported successfully`]
            );

            res.send("Found item added");
        }
    );
});

app.get("/stats/:userId", (req,res)=>{
    const userId = req.params.userId;

    db.query(
        `SELECT 
        (SELECT COUNT(*) FROM lost_items WHERE user_id=?) as lost,
        (SELECT COUNT(*) FROM found_items WHERE user_id=?) as found`,
        [userId,userId],
        (err,result)=>{
            res.json(result[0]);
        }
    );
});

app.get("/my-reports/:userId", (req,res)=>{
    const userId = req.params.userId;

    db.query(
        `SELECT 'Lost' as type, item_name, location, date_lost as date, status 
         FROM lost_items WHERE user_id=?
         UNION
         SELECT 'Found', item_name, location, date_found, status 
         FROM found_items WHERE user_id=?`,
        [userId,userId],
        (err,result)=>{
            res.json(result);
        }
    );
});

app.get("/user/:id", (req,res)=>{
    const id = req.params.id;

    db.query("SELECT * FROM users WHERE id=?", [id], (err,result)=>{
        if(err) return res.json({});
        res.json(result[0]);
    });
});

app.get("/search", (req,res)=>{
    const { name, category, location, status } = req.query;

    let query = `
        SELECT item_name, category, location, 'Lost' as status FROM lost_items
        UNION
        SELECT item_name, category, location, 'Found' FROM found_items
    `;

    db.query(query, (err, result)=>{
        if(err) return res.json([]);

        let filtered = result.filter(item => {
            return (
                (!name || item.item_name.toLowerCase().includes(name.toLowerCase())) &&
                (!category || item.category === category) &&
                (!location || item.location === location) &&
                (!status || item.status === status)
            );
        });

        res.json(filtered);
    });
});

app.post("/update-profile", (req,res)=>{
    const { id, phone, dept } = req.body;

    db.query(
        "UPDATE users SET phone=?, dept=? WHERE id=?",
        [phone,dept,id],
        (err)=>{
            if(err) return res.send("Error updating");
            res.send("Profile updated");
        }
    );
});

const bcrypt = require("bcrypt");

app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!email.endsWith("@krmu.edu.in")) {
        return res.send("Use university email");
    }

    const hashed = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashed],
        (err) => {
            if (err) return res.send("Error or Email exists");
            res.send("Signup successful");
        }
    );
});