import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';


const storage = new Storage();

const rawVideoBucketName = "hikki-tv-raw-videos";
const processedVideoBucketName = "hikki-tv-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/** 
* Creates the local directories for raw and processed videos
*/
export function setupDirectories() {
    ensureDirectoryExists(localRawVideoPath);
    ensureDirectoryExists(localProcessedVideoPath);

}

/** 
* @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
* @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
* @returns A promise that resolves when the video has been converted.
*/
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    //converting the video into resolution we want in this case 360P
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:360")
            .on("end", () => {
                console.log("Video processing started successfully");
                resolve();
            })
            .on("error", (err) => {
                console.log(`An error occurred: ${err.message}`);
                reject(err);
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}


export async function downloadVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}` });
    console.log(`gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.`);
}

export async function uploadVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);
    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, { destination: fileName });
    console.log(`${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`);
    await bucket.file(fileName).makePublic();
}


export function deleteRawVideo(filename: string) {
    return deleteFile(`${localRawVideoPath}/${filename}`);
}

export function deleteProcessedVideo(filename: string) {
    return deleteFile(`${localProcessedVideoPath}/${filename}`);
}

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err);
                } else {
                    console.log(`file deleted at ${filePath}`);
                    resolve();
                }
            });
        } else {
            console.log(`file not found at ${filePath}, skipping the error`);
            resolve();
        }
    });
}
   

function ensureDirectoryExists(dirpath: string) {
    if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true }); //recursive true enables creating nested directories
        console.log(`Directory ${dirpath} created successfully`)
    }
}