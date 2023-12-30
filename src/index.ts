import express from "express";
import ffmpeg from "fluent-ffmpeg";


const app = express();
app.use(express.json());


app.post('/process-video', (req, res) => {
    //get path of the input video file from req body 
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;
    //Error handling for client side reqs :
    if (!inputFilePath || !outputFilePath) {
        res.status(404).send("Bad request: Missing file path.");
    }
    //converting the video into resolution we want in this case 360P
    ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=-1:360")
        .on("end", () => {
            res.status(200).send("video processing started successfully")
        })
        .on("error", (err) => {
            console.log(`An error occurred: ${err.message}`);
            res.status(500).send("Internal Server Error: ${err.message}");
        })
        .save(outputFilePath);
    
});


const port = process.env.PORT || 3000; // default
app.listen(port, () => {
    console.log(`video processing service listening at http://localhost:${port}`)
});

