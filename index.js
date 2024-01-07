import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import { NetlifyAPI } from "netlify";
import { Octokit } from "@octokit/rest";
import { execa } from "execa";
import { execSync } from "child_process";
import FormData from "form-data";
import archiver from "archiver";
import dotenv from "dotenv";
import simpleGit from "simple-git";
import axios from "axios";

import sdk from "api";
const instance = sdk("@render-api/v1.0#aiie8wizhlp1is9bu");

dotenv.config();

let PortfolioCount = 1;
const app = express();
const port = 3001;
const githubToken = process.env.GITHUB_ACCESS_TOKEN;
const githubname = process.env.GITHUB_USER_NAME;
const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
const renderToken = process.env.RENDERKEY;
const renderOwnerKey = process.env.RENDEROWNERKEY;
const localDirectoryPath = "photography-portfolio-1";
const client = new NetlifyAPI(netlifyToken);
const commitMessage = "Your commit message here";
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
function modifyFile(content, filePath) {
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

const createRepository = async (username, folderName , buildPath) => {
  console.log("Creating repo");
  try {
    const updatedFolderPath = path.join(__dirname, folderName);
    const repositoryResponse = await axios.post(
      `https://api.github.com/user/repos`,
      {
        name: username,
        private: false,
      },
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    console.log("Repository created:", repositoryResponse.data.html_url); //
    console.log(repositoryResponse.data.html_url);
    
    await gitCommands(
      folderName,
      repositoryResponse.data.html_url,
      username,
      buildPath
    );
    console.log("git uploaded");
    await deployToRender(username ,  repositoryResponse.data.html_url, buildPath)
  } catch (error) {
    console.error("Error creating reposity:", error.response?.data);
  }
};

function getNewContent(body) {
  let newContent, assetsFolder, filePath, emailAddress, navName, about1Paragraph, about2HeadingText, about2Paragraph, about3Paragraph, linkedInLink, instagramLink, twitterLink, gitHubLink, para, repoPath, buildPath, tagline, heroLine1, heroLine2, heroLine3, project1Title, project2Title, project3Title, project4Title, project5Title, project6Title, project1Link, project2Link, project3Link, project4Link, project5Link, project6Link, aboutLine1, aboutLine2, aboutLine3, aboutLine4, aboutPara1, aboutPara2, aboutPara3, aboutPara4, aboutHead2, aboutHead3, aboutHead4;

  switch (body.variant) {
    case "Photography-Portfolio-1":
      ({
        emailAddress,
        navName,
        about1Paragraph,
        about2HeadingText,
        about2Paragraph,
        about3Paragraph,
        linkedInLink,
        instagramLink,
        twitterLink,
      } = body);

      newContent = `
        const emailAddress = "${emailAddress}";
        const navName = "${navName}";
        const about1FullParagraph = "${about1Paragraph}";
        const about2HeadingFullText = "${about2HeadingText}";
        const about2Paragraph = "${about2Paragraph}";  
        const about3Paragraph = "${about3Paragraph}";
        const linkedInLink = "${linkedInLink}";
        const instagramLink = "${instagramLink}";
        const twitterLink = "${twitterLink}";`;

      assetsFolder =  path.join(
        __dirname,
        "photography-portfolio-1",
        "src",
        "assets"
      );
      filePath = path.join(
        __dirname,
        "photography-portfolio-1",
        "src",
        "components",
        "Landing.jsx"
      );
      repoPath = "photography-portfolio-1"
      buildPath = "dist"
      break;

    case "Photography-Portfolio-2":
      ({ emailAddress, para, linkedInLink, instagramLink } = body);

      newContent = `
        const insta = "${instagramLink}";
        const mail = "${emailAddress}";
        const linkedIn = "${linkedInLink}";
        const para = "${para}";`;

      assetsFolder =  path.join(
        __dirname,
        "PhotographerPortfolio",
        "src",
        "assets"
      );
      filePath = path.join(
        __dirname,
        "PhotographerPortfolio",
        "src",
        "index.js"
      );
      repoPath = "PhotographerPortfolio"
      buildPath = "build"
      break;
    
    case "Developer-Portfolio-1":
      ({navName , emailAddress , linkedInLink, instagramLink, twitterLink, gitHubLink, tagline, heroLine1, heroLine2, heroLine3, project1Title, project2Title, project3Title, project4Title, project5Title, project6Title, project1Link, project2Link, project3Link, project4Link, project5Link, project6Link, aboutLine1, aboutLine2, aboutLine3, aboutLine4, aboutPara1, aboutPara2, aboutPara3, aboutPara4, aboutHead2, aboutHead3, aboutHead4} = body)
      newContent = `
      const tagline = '${tagline}';
      const name = '${navName}';
      const email = '${emailAddress}';
      const heroLine1 = '${heroLine1}';
      const heroLine2 = '${heroLine2}';
      const heroLine3 = '${heroLine3}';
      const gitHub = '${gitHubLink}';
      const linkedIn = '${linkedInLink}';
      const twitter = '${twitterLink}';
      const project1 = ['${project1Title}', '${project1Link}', null, 'pic1.png'];
      const project2 = ['${project2Title}', '${project2Link}', null, 'pic2.png'];
      const project3 = ['${project3Title}', '${project3Link}', null, 'pic3.png'];
      const project4 = ['${project4Title}', '${project4Link}', null, 'pic4.png'];
      const project5 = ['${project5Title}', '${project5Link}', null, 'pic5.png'];
      const project6 = ['${project6Title}', '${project6Link}', null, 'pic6.png'];
      const aboutLine1= "${aboutLine1}";
      const aboutLine2= '${aboutLine2}';
      const aboutLine3= '${aboutLine3}';
      const aboutLine4= '${aboutLine4}';
      const aboutPara1= '${aboutPara1}';
      const aboutPara2= '${aboutPara2}';
      const aboutPara3= '${aboutPara3}';
      const aboutPara4= '${aboutPara4}';
      const aboutHead2= '${aboutHead2}';
      const aboutHead3= '${aboutHead3}';
      const aboutHead4= '${aboutHead4}';
      const aboutImage= [null, 'pic7.png'];`
      assetsFolder = path.join(__dirname,"Portfolio","public");
      repoPath = "Portfolio"
      buildPath = "dist"
      filePath = path.join(
        __dirname,
        "Portfolio",
        "src",
        "App.jsx"
      );
      break;
    default:
      console.log("unknown variant: ",body.variant)
      break;
  }

  return [newContent, assetsFolder, filePath ,repoPath , buildPath];
}

async function gitCommands(folderName, repoLink, username) {
  console.log("doint git commands");
console.log(folderName , repoLink , username)
  try {
    const repoPath = path.resolve(__dirname, folderName);
    const git = simpleGit(repoPath);
    git.env({
      GIT_SSH_COMMAND: `ssh -o 'StrictHostKeyChecking=no' -i ~/.ssh/id_rsa`,
    });
    process.chdir(repoPath);
    // console.log('changed dir')
    await git.removeRemote("origin");
    await git.addRemote("origin", repoLink);
    // console.log("changed origin")
    await git.add(".");
    await git.commit("first commit");
    await git.addConfig("user.name", "Portfoliify");
    // console.log("git added")
    
    await git.addConfig("user.email", "tnmadgaming9920@gmail.com");
    await git.addConfig("credential.helper", "store");
    await git.addConfig("credential.useHttpPath", "true");
    await git.addConfig(
      "http.extraHeader",
      `AUTHORIZATION: basic ${Buffer.from(
        `${githubToken}:x-oauth-basic`
      ).toString("base64")}`
    );
    await git.push(["-u", "origin", "template"]);
    // console.log("git pushed")

    process.chdir("..");
    console.log("Uploaded to GitHub successfully.");
   
  } catch (error) {
    console.error("Error Uploading to GitHub :", error?.message); // GN BRUH ;)
  }
}

async function deployToRender(username, repo , buildPath) {
  instance.auth(renderToken);

  instance
    .createService({
      type: "static_site",
      autoDeploy: "yes",
      serviceDetails: {
        pullRequestPreviewsEnabled: "no",
        buildCommand: "npm run build",
        publishPath: buildPath,
      },
      name:  username,
      ownerId:  renderOwnerKey,
      repo:  repo,
      branch: "template",
      rootDir: "./",
    })
    .then(({ data }) => console.log(data.service.serviceDetails.url))
    .catch((err) => console.error(err));
}

app.post("/upload", upload.array("file"), async (req, res) => {
  try {
    const [newContent, assetsFolder, filePath , repoPath , buildPath] = getNewContent(req.body);
    modifyFile(newContent, filePath);

    let i = 1;
    console.log(req.files?.length,assetsFolder);
    req.files.forEach((file) => {
      const filePath = `${assetsFolder}/pic${i}.png`;
      fs.writeFileSync(filePath, file.buffer);
      i += 1;
    });
    console.log("paths" ,assetsFolder , filePath)
    createRepository(
      `${req.body.navName ? req.body.navName : "Portfoliify"} Portfolio-${PortfolioCount++}`,
      repoPath , 
      buildPath
    );

    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
