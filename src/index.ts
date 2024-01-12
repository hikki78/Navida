import express from "express"; 
import { convertVideo, downloadRawVideo, uploadProcessedVideo, deleteRawVideo, deleteProcessedVideo, setupDirectories} from "./storage";

setupDirectories();

const app = express();
app.use(express.json());


app.post('/process-video', async (req, res) => {
    //get the bucket and filename from the cloud pub-sub message 
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload recieved.');
        }
    } catch (err) {
        console.error(err);
        res.status(400).send('Bad Request');
        return;
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    // Download the raw video from cloud storage 
    await downloadRawVideo(inputFileName);

    // Convert the raw video into a 360P video
    try {
        await convertVideo(inputFileName, outputFileName);
    } catch (err) {
        await Promise.all([
            deleteRawVideo(inputFileName),       //delete the raw video from cloud storage
            deleteProcessedVideo(outputFileName)
        ]);
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
    }

    
    //upload the processed video to cloud storage 
    await uploadProcessedVideo(outputFileName);


    // Delete the raw and processed video if we are sucessful and we uploaded the processed video to the cloud storage 
    await Promise.all([
            deleteRawVideo(inputFileName),       
            deleteProcessedVideo(outputFileName)
    ]);
    res.status(200).send('good lord man we at last finished processing ffs');
    });


const port = process.env.PORT || 3000; // default
app.listen(port, () => {
    console.log(`video processing service listening at http://localhost:${port}`)
});

