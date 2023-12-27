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

let i = 1;
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
    // await createNetlifySite(username, repositoryResponse.data.html_url);
    // console.log("hosted successfull");

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
  let newContent,
    assetsFolder,
    filePath,
    emailAddress,
    navName,
    about1Paragraph,
    about2HeadingText,
    about2Paragraph,
    about3Paragraph,
    linkedInLink,
    instagramLink,
    twitterLink,
    para,
    repoPath,
    buildPath;

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

      assetsFolder = "./Photography-Portfolio-1/src/assets";
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

      assetsFolder = "/PhotographerPortfolio/src/assets";
      filePath = path.join(
        __dirname,
        "PhotographerPortfolio",
        "src",
        "index.js"
      );
      repoPath = "PhotographerPortfolio"
      buildPath = "build"
      break;

    default:
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
    console.error("Error Uploading to GitHub :", error?.message);
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
    console.log(req.files?.length);
    req.files.forEach((file) => {
      const filePath = `${assetsFolder}/pic${i}.png`;
      fs.writeFileSync(filePath, file.buffer);
      i += 1;
    });
    console.log("paths" ,assetsFolder , filePath)
    createRepository(
      `${req.body.navName ? req.body.navName : "Portfoliify"} Portfolio-${i++}`,
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
