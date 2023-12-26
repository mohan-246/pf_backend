import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import { NetlifyAPI } from "netlify";
import { Octokit } from "@octokit/rest";
import {execa} from 'execa';
import { execSync } from "child_process";
import FormData from "form-data";
import archiver from "archiver";
import dotenv from "dotenv";
import simpleGit from "simple-git";
import axios from "axios";
dotenv.config();

let i = 1;
const app = express();
const port = 3001;
const githubToken = process.env.GITHUB_ACCESS_TOKEN;
const githubname = process.env.GITHUB_USER_NAME;
const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
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

const createRepository = async (username, folderName) => {
  console.log("Creating repo"); //create repo
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

    console.log("Repository created:", repositoryResponse.data.html_url);
    console.log(repositoryResponse.data.html_url);
    await gitCommands(folderName, repositoryResponse.data.html_url); //npm i , npm run build , git upload
    console.log("git uploaded");

    //host in github pages

    // await createNetlifySite(username, repositoryResponse.data.html_url); // host on netlify
    // console.log("hosted successfull");
    
  } catch (error) {
    console.error("Error creating reposity:", error.response?.data);
  }
};

function getNewContent(body) {
  let newContent, assetsFolder, filePath;
  switch (body.variant) {
    case "Photography-Portfolio-1":
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
      } = body;
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

      break;
    case "photography-portfolio-2/dist":
      const { insta, email, para } = body;
      newContent = `
       const insta = "${insta}";
      const email = "${email}";
      const para = "${para}"`;
      assetsFolder = "/PhotographerPortfolio/src/assets";
      filePath = path.join(
        __dirname,
        "PhotographerPortfolio",
        "src",
        "index.js"
      );

      break;
    default:
      break;
  }
  return [newContent, assetsFolder, filePath];
}

async function gitCommands(folderName, repoLink) {
  console.log("doint git commands");

 
  try {
    const repoPath = path.resolve(__dirname, folderName);
    const git = simpleGit(repoPath);
    git.env({
      GIT_SSH_COMMAND: `ssh -o 'StrictHostKeyChecking=no' -i ~/.ssh/id_rsa`,
    });
    process.chdir(repoPath);

    // Remove existing remote and add the new one
    await git.removeRemote("origin");
    await git.addRemote("origin", repoLink);

    // Run npm run build
    console.log("Running npm install...");
    // await execa('npm', ['install'], { cwd: repoPath, stdio: 'inherit' });

    console.log("Running npm run build...");
    await execa('npm', ['run', 'build'], { cwd: repoPath, stdio: 'inherit' });

    // Switch to the gh-pages branch or create it if it doesn't exist
    // await git.checkoutLocalBranch("template");

    // Add the contents of the "dist" folder
    await git.add('dist');

    // Commit the changes
    await git.commit('Add contents of the "dist" folder');

    // Configure git user and credentials
    await git.addConfig('user.name', 'Portfoliify');
    await git.addConfig('user.email', 'tnmadgaming9920@gmail.com');
    await git.addConfig('credential.helper', 'store');
    await git.addConfig('credential.useHttpPath', 'true');
    await git.addConfig(
      'http.extraHeader',
      `AUTHORIZATION: basic ${Buffer.from(
        `${githubToken}:x-oauth-basic`
      ).toString('base64')}`
    );

    // Push the changes to GitHub Pages branch
    await git.push(['-u', 'origin', 'template']);

    process.chdir('..');
    console.log('Git commands executed successfully.');
  } catch (error) {
    console.error("Error executing Git commands:", error.message);
  }
}
async function createNetlifySite(netlifySiteName, githubRepo) {
  console.log(githubRepo);
  try {
    // Step 1: Create a new site on Netlify
    const createSiteResponse = await axios.post(
      "https://api.netlify.com/api/v1/sites",
      {
        build_settings: {
          cmd: 'npm install && npm run build',
          dir: 'dist',
          allowed_branches: [ 'template' ],
          public_repo: true,
          package_path: '',
          provider: 'github',
          repo_type: 'git',
          repo_url: githubRepo,
          repo_branch: 'template',
          repo_owner_type: 'User',
          base: '',
        },
        name: netlifySiteName,
      },
      {
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
        },
      }
    );

    console.log(createSiteResponse?.status);

    console.log(`New Netlify site created: ${netlifySiteName}`);
  } catch (error) {
    console.error(
      "Error creating Netlify site:",
      error.response ? error.response : error.message
    );
  }
}
async function createNetlifySiteNpm(netlifySiteName, githubRepo) {
  try {
    const site = await client.createSite({
      body: {
        name: netlifySiteName,
        build_settings: {
          cmd: 'npm install && npm run build',
          allowed_branches: [ 'template' ],
          public_repo: true,
          provider: 'github',
          repo_type: 'git',
          repo_url: 'https://github.com/Portfoliify/sample-2-Portfolio-1',
          repo_branch: 'template',
          repo_path: 'Portfoliify/sample-2-Portfolio-1',
          repo_owner_type: 'User',
        },
      },
    });

    console.log("New Netlify site created:");
    console.log(`Site URL: ${site.url}`,"id",site?.id);
    await axios.post(
      `https://api.netlify.com/api/v1/sites/${site.id}/builds`,
      {},
      {
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
        },
      }
    );
    console.log("Deployment initiated for the site.");
    console.log(`Site URL: ${site}`);
  } catch (error) {
    console.error("Error creating Netlify site:", error?.response?.data);
  }
}

app.post("/upload", upload.array("file"), async (req, res) => {
  try {
    const [newContent, assetsFolder, filePath] = getNewContent(req.body);
    modifyFile(newContent, filePath);
    if (!fs.existsSync(assetsFolder)) {
      fs.mkdirSync(assetsFolder);
    }
    let i = 1;
    console.log(req.files?.length);
    req.files.forEach((file) => {
      const filePath = `${assetsFolder}/pic${i}.png`;
      fs.writeFileSync(filePath, file.buffer);
      i += 1;
    });

    createRepository(
      `${req.body.navName ? req.body.navName : "rehman"} Portfolio-${i++}`,
      req.body.variant
    );
    // createNetlifySiteNpm(
    //   "sample-6-portfolio-3",
    //   "https://github.com/Portfoliify/samplee3-Portfolio-1"
    // );
    // const sites = await client.listSites()
    // for (const site of sites) {
    //   if(site.id == "85966740-cfbc-4dd5-b16c-9cf3c9759cb7"){
    //     // console.log(site)
    //   }
    //   else{
    //     await client.deleteSite({ site_id: site.id })
    //   }
    //   console.log(site?.id)
      
    // }

    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
