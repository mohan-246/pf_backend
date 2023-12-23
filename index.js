import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import {fileURLToPath} from "url";
import path , {dirname , join} from "path";

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({
    limits: {
      // Increase the field size limit to accommodate larger files
      fieldSize: 100 * 1024 * 1024, // 10 MB (adjust the size according to your needs)
    },
  });
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

app.get("/", (req, res) => {
  console.log("ji");
});
app.post("/host", (req, res) => {
  const data = req.body;
  console.log("Received data:", data);

  res.send("Data received successfully!");
});
function readFile(content){
  const filePath = path.join(__dirname, 'photography-portfolio-1', 'src', 'components', 'Landing.jsx');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
    } else {
      const firstTenCharacters = data.slice(10, 20);
      console.log('First 10 characters of Landing.jsx:', firstTenCharacters);
    }
  });
}
app.post('/upload', upload.array('file'), (req, res) => {
    try {
      const {
        emailAddress,
        navName,
        about1Paragraph,
        about2HeadingText,
        about2Paragraph,
        about3Paragraph,
        linkedInLink,
        instagramLink,
        twitterLink,
      } = req.body;
  
      const assetsFolder = './assets';
      if (!fs.existsSync(assetsFolder)) {
        fs.mkdirSync(assetsFolder);
      }
  
      const texts = [
        emailAddress,
        navName,
        about1Paragraph,
        about2HeadingText,
        about2Paragraph,
        about3Paragraph,
        linkedInLink,
        instagramLink,
        twitterLink,
      ];
      for (const text of texts) {
        console.log(text);
      }
      let i = 1
      console.log(req.files?.length)
      req.files.forEach((file) => {
        const uniqueFileName = `${file.originalname}`;
        
        const filePath = `${assetsFolder}/pic${i}.png`;
        fs.writeFileSync(filePath, file.buffer);
        i += 1
      });
  
      res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
      console.error('Error handling file upload:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
    readFile()
  });
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
