import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";
import userRoute from "./routes/User.js";  
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
//import { User } from "./models/user.js";  
import { User } from "./Models/User.js"; 
import { AttendanceLogs } from "./models/attendanceLogs.js";  
import dotenv from "dotenv";




dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";  



app.use(cors());
app.use(express.json());
app.use("/user", userRoute);



app.get("/", (req, res) => {
  res.send("Hello " + (req.query.name || "Guest"));
});

app.get("/hello", (req, res) => {
  res.send("Hello world");
});

app.post("/register", async (req, res) => {
  console.log("Someone is trying to register...");
  const { name, password, email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) return res.status(400).send({ message: "User already exists" });

    const encryptedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ name, password: encryptedPassword, email });
    await newUser.save();

    return res.status(201).send("Registered successfully");
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal error", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && bcrypt.compareSync(password, user.password)) {  
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).send({ message: "Login success", token });
    } else {
      return res.status(401).send({ message: "Wrong email or password" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal error", error: error.message });
  }
});

app.get("/userprofile", async (req, res) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) return res.status(401).send({ message: "Auth required" });

    const decodedUser = jwt.verify(authorization, JWT_SECRET);
    const user = await User.findById(decodedUser.id).select("name email");

    return res.status(200).send({ message: "Fetched user", user });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal error", error: error.message });
  }
});

// Connect to MongoDB and Start Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ DB connected");

    AdminJS.registerAdapter({
      Resource: AdminJSMongoose.Resource,
      Database: AdminJSMongoose.Database,
    });

    const admin = new AdminJS({
      resources: [User, AttendanceLogs],  
    });

    const adminRouter = AdminJSExpress.buildRouter(admin);
    app.use(admin.options.rootPath, adminRouter);

    

    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection error: ", err);
  });
