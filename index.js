import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

let i = 1;
const app = express();
const port = 3000;
const githubToken = process.env.GITHUB_ACCESS_TOKEN;
const githubname = process.env.GITHUB_USER_NAME;
const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100mb
  },
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get("/", (req, res) => {
  res.send("Hii what yew looking at 👀?");
});
function modifyFile(content) {
  const filePath = path.join(
    __dirname,
    "photography-portfolio-1", //folder name
    "src", //folder name
    "components", // folder
    "Landing.jsx" //file
  );
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }
    const modifiedContent = modifyContentBetweenComments(data, content);
    fs.writeFile(filePath, modifiedContent, "utf8", (writeErr) => {
      if (writeErr) {
        console.error("Error writing file:", writeErr);
      } else {
        console.log(
          'Content between //Content comments has been replaced with "hi".'
        );
      }
    });
  });
}
function modifyContentBetweenComments(fileContent, newContent) {
  //newcontent is the modidied text , file content is the original template
  const startComment = "//Content";
  const endComment = "//Content";
  const startIndex = fileContent.indexOf(startComment);
  const endIndex = fileContent.indexOf(
    endComment,
    startIndex + startComment.length
  );
  if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find //Content comments in the file.");
    return fileContent;
  }
  const modifiedContent =
    fileContent.substring(0, startIndex + startComment.length) +
    "\n" +
    newContent +
    "\n" +
    fileContent.substring(endIndex);

  return modifiedContent;
}

const getAllFilesInFolder = (folderPath) => {
  const allFiles = [];

  const readFolder = (currentPath) => {
    const folderContents = fs.readdirSync(currentPath);

    for (const item of folderContents) {
      const itemPath = path.join(currentPath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        // Recursively read subdirectory
        readFolder(itemPath);
      } else {
        // Add file path to the result array
        allFiles.push(itemPath);
      }
    }
  };

  readFolder(folderPath);
  return allFiles;
};

const createRepository = async (username, folderPath) => {
  try {
    const updatedFolderPath = path.join(__dirname, "photography-portfolio-1");
    const repositoryResponse = await axios.post(
      `https://api.github.com/user/repos`,
      {
        name: username,
        private: false,
      },
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    console.log('Repository created:', repositoryResponse.data.html_url);

    deploy(updatedFolderPath)
    
  } catch (error) {
    console.error('Error creating reposity:', error.response?.data?.message);
   
    
  }
};

async function deploy(localDirectoryPath) {
  try { 
    const response = await axios.post(
      'https://api.netlify.com/api/v1/sites',
      {},
      {
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
        },
      }
    );
    const netlifySiteName = response.data.name;
    console.log('Deployment started on Netlify.');
    console.log('Visit the deployment status at:', response.data.deploy_url);
    console.log('Netlify site name:', netlifySiteName);
    
  } catch (error) {
    console.error('Error deploying the project:', error.message);
  }
}


app.post("/upload", upload.array("file"), (req, res) => {
  try {
    const {
      variant,
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
    const newContent = `
  const emailAddress = "${emailAddress}";
  const navName = "${navName}";
  const about1FullParagraph = "${about1Paragraph}";
  const about2HeadingFullText = "${about2HeadingText}";
  const about2Paragraph = "${about2Paragraph}";  
  const about3Paragraph = "${about3Paragraph}";
  const linkedInLink = "${linkedInLink}";
  const instagramLink = "${instagramLink}";
  const twitterLink = "${twitterLink}";`;
    modifyFile(newContent);
    const assetsFolder = "./assets";
    if (!fs.existsSync(assetsFolder)) {
      fs.mkdirSync(assetsFolder);
    }

    let i = 1;
    console.log(req.files?.length);
    req.files.forEach((file) => {
      const uniqueFileName = `${file.originalname}`;

      const filePath = `${assetsFolder}/pic${i}.png`;
      fs.writeFileSync(filePath, file.buffer);
      i += 1;
    });

    createRepository(`${navName} Portfolio-${i++}`, variant);
    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
