
require("dotenv").config();
const express = require("express"),
    cookieParser = require("cookie-parser"),
    bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
try {
    let db = mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("Connected successfully");
} catch (err) {
    console.log("error while connecting db", err);
}

// Create a Mongoose model for the image collection
const Image = mongoose.model("Image", new mongoose.Schema({ path: String, type: String, url: String, name: String }));

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Create an "uploads" directory in your project
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ dest: 'uploads/' })
app.use('/uploads', express.static('uploads'));
app.get("/images/:imagePath", (req, res) => {
    const imagePath = req.params.imagePath;
    res.sendFile(imagePath, { root: __dirname + "/uploads" });
});
// Define an endpoint to upload an image
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const { path } = req.file;
        const { type, url, name } = req.body; // Capture the "type" from the request body
        const image = new Image({ path, type, url, name });
        await image.save();
        res.status(201).json({ message: "Image uploaded successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error", message: error });
    }
});


// Define an endpoint to get all images
app.get("/images", async (req, res) => {
    try {
        const images = await Image.find();
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/images/:imageId", async (req, res) => {
    try {
        const imageId = req.params.imageId;
        const image = await Image.findById(imageId);

        if (!image) {
            return res.status(404).json({ error: "Image not found" });
        }

        const imagePath = image.path;
        await Image.deleteOne({ _id: imageId }); // Use deleteOne() to remove the image
        res.json({ message: "Image deleted successfully" });
    } catch (error) {
        console.log({ error });
        res.status(500).json({ error: "Internal server error", message: error });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
