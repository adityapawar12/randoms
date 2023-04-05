const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const multer = require("multer");
const tf = require("@tensorflow/tfjs-node");
const cocoSsd = require("@tensorflow-models/coco-ssd");

const app = express();
const port = 3000;
app.use(bodyParser.raw({ type: "image/*", limit: "10mb" }));

// Set up multer for parsing form data with a 'file' field
const upload = multer({ dest: "uploads/" });

// Load the COCO-SSD model
let model;
cocoSsd.load().then((loadedModel) => {
  model = loadedModel;
});

// Define a route for detecting objects in an image
app.post("/detect-objects", (req, res) => {
  console.log("ok");
  console.log(req.files);
  return;
  // Load the image from the file path in req.file
  const image = tf.node.decodeImage(req.file.buffer);

  // Detect objects in the image using the COCO-SSD model
  model.detect(image).then((predictions) => {
    // Send the predictions as JSON to the frontend
    res.json(predictions);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
