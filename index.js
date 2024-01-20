import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import dotenv from "dotenv";
import simpleGit from "simple-git";
import axios from "axios";
import mongoose from "mongoose";
import sdk from "api";
const instance = sdk("@render-api/v1.0#aiie8wizhlp1is9bu");
import { v4 as uuidv4 } from "uuid";
import { initializeApp } from "firebase/app";
import pkg from "base-64";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

dotenv.config();
const { decode: base64_decode, encode: base64_encode } = pkg;
let PortfolioCount = 1;
const app = express();
const port = 3001;
app.use(cors({ origin: "*" }));
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoPaths = [
  "DesignerPortfolio",
  "developer-portfolio",
  "PhotographerPortfolio",
  "photography-portfolio-1",
];
for (const rp of repoPaths) {
  const rP = path.resolve(__dirname, rp);

  const git = simpleGit(rP);
  git.env({
    GIT_SSH_COMMAND: `ssh -o 'StrictHostKeyChecking=no' -i ~/.ssh/id_rsa`,
  });
  process.chdir(rP);
 
  try { 
    await git.init();
    const branches = await git.branchLocal();
    console.log(branches.all);
    await git.checkoutLocalBranch('test2'); 
    const existingRemotes = await git.getRemotes(true);
    console.log(existingRemotes.length);
    if (existingRemotes.length <= 0) {
      await git.addRemote('origin', 'example');
      console.log('Remote "origin" added successfully.');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }

  process.chdir("..");
}

const storage = multer.memoryStorage();
const upload = multer({
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100mb
  },
});
const UserSchema = new mongoose.Schema({
  userID: String,
  sites: [
    {
      Template: String,
      SiteID: String,
      Source: String,
      Link: String,
      CreatedAt: String,
      Status: String,
    },
  ],
});
const User = mongoose.model("User", UserSchema);
mongoose.connect(process.env.MONGODB_URL);

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
        // console.log(
        //   'Content between //Content comments has been replaced with "hi".'
        // );
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
async function createRepository(username, folderName, buildPath) {
  // console.log("Creating repo");
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
          Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    const sourceLink = repositoryResponse.data.html_url;
    // console.log("Repository created:", sourceLink);
    // console.log(sourceLink);

    await gitCommands(folderName, sourceLink, username, buildPath);
    // console.log("git uploaded");

    return sourceLink;
  } catch (error) {
    console.error("Error creating reposity:", error.response?.data);
    res.status(500).json({ error: "Internal server error" });
  }
}
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
    gitHubLink,
    para,
    repoPath,
    buildPath,
    tagline,
    heroLine1,
    heroLine2,
    heroLine3,
    project1Title,
    project2Title,
    project3Title,
    project4Title,
    project5Title,
    project6Title,
    project1Link,
    project2Link,
    project3Link,
    project4Link,
    project5Link,
    project6Link,
    aboutLine1,
    aboutLine2,
    aboutLine3,
    aboutLine4,
    aboutPara1,
    aboutPara2,
    aboutPara3,
    aboutPara4,
    aboutHead2,
    aboutHead3,
    aboutHead4,
    number,
    exp,
    rightExp,
    prLine,
    d1,
    d2,
    d3,
    d4,
    d5,
    d6,
    userID,
    templateType;

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
        userID,
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

      assetsFolder = path.join(
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
      repoPath = "photography-portfolio-1";
      buildPath = "dist";
      templateType = "Photography-1";
      break;

    case "Photography-Portfolio-2":
      ({ emailAddress, para, linkedInLink, instagramLink, userID } = body);

      newContent = `
        const insta = "${instagramLink}";
        const mail = "${emailAddress}";
        const linkedIn = "${linkedInLink}";
        const para = "${para}";`;

      assetsFolder = path.join(
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
      repoPath = "PhotographerPortfolio";
      buildPath = "build";
      templateType = "Photography-2";
      break;

    case "Developer-Portfolio-1":
      ({
        navName,
        emailAddress,
        linkedInLink,
        instagramLink,
        twitterLink,
        gitHubLink,
        tagline,
        heroLine1,
        userID,
        heroLine2,
        heroLine3,
        project1Title,
        project2Title,
        project3Title,
        project4Title,
        project5Title,
        project6Title,
        project1Link,
        project2Link,
        project3Link,
        project4Link,
        project5Link,
        project6Link,
        aboutLine1,
        aboutLine2,
        aboutLine3,
        aboutLine4,
        aboutPara1,
        aboutPara2,
        aboutPara3,
        aboutPara4,
        aboutHead2,
        aboutHead3,
        aboutHead4,
      } = body);

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
      const aboutImage= [null, 'pic7.png'];`;
      assetsFolder = path.join(__dirname, "deveoper-portfolio", "public");
      repoPath = "developer-portfolio";
      buildPath = "dist";
      filePath = path.join(__dirname, "developer-portfolio", "src", "App.jsx");
      templateType = "Developer-1";
      break;

    case "Designer-Portfolio-1":
      ({
        emailAddress,
        navName,
        number,
        exp,
        rightExp,
        para,
        prLine,
        d1,
        d2,
        d3,
        d4,
        d5,
        d6,
        userID,
      } = body);

      newContent = ` const prline = '${prLine}';
      const [username, setusername] = '';
      const para = '${para}';
      const title = '${navName}';
      const exp = '${exp}';
      const rightexp = '${rightExp}';
      const [designTitle, setdt] = '';
      const d1 = '${d1}';
      const d2 = '${d2}';
      const d3 = '${d3}';
      const d4 = '${d4}';
      const d5 = '${d5}';
      const d6 = '${d6}';
      const email = '${emailAddress}';
      const number = '${number}';
      const [pic1Source, setpic1Source] = useState([pic1, null]);
      const [pic2Source, setpic2Source] = useState([pic2, null]);
      const [pic3Source, setpic3Source] = useState([pic3, null]);
      const [pic4Source, setpic4Source] = useState([pic4, null]);
    
      const [pic5Source, setpic5Source] = useState([pic5, null]);
      const [pic6Source, setpic6Source] = useState([pic6, null]);
      const [pic7Source, setpic7Source] = useState([pic7, null]);
      const [pic8Source, setpic8Source] = useState([pic8, null]);
      const [pic9Source, setpic9Source] = useState([pic9, null]);
      const [pic10Source, setpic10Source] = useState([pic10, null]);
    `;
      assetsFolder = path.join(__dirname, "DesignerPortfolio", "src", "assets");
      repoPath = "DesignerPortfolio";
      buildPath = "build";
      filePath = path.join(__dirname, "DesignerPortfolio", "src", "index.js");
      templateType = "Designer-1";
      break;
    default:
      console.log("unknown variant: ", body.variant);
      return [null, null, null, null, null, null, null];
      break;
  }

  return [
    newContent,
    assetsFolder,
    filePath,
    repoPath,
    buildPath,
    templateType,
    userID,
  ];
}
async function gitCommands(folderName, repoLink, username) {
  // console.log("doint git commands");
  // console.log(folderName, repoLink, username);
  try {
    const repoPath = path.resolve(__dirname, folderName);

    const git = simpleGit(repoPath);
    git.env({
      GIT_SSH_COMMAND: `ssh -o 'StrictHostKeyChecking=no' -i ~/.ssh/id_rsa`,
    });
    process.chdir(repoPath);
    await git.init();

    await git.removeRemote("origin");
    await git.addRemote("origin", repoLink);

    await git.add(".");
    await git.commit("first commit");
    await git.addConfig("user.name", "Portfoliify");

    await git.addConfig("user.email", process.env.GITHUB_EMAIL_ADDRESS);
    await git.addConfig("credential.helper", "store");
    await git.addConfig("credential.useHttpPath", "true");
    await git.addConfig(
      "http.extraHeader",
      `AUTHORIZATION: basic ${Buffer.from(
        `${process.env.GITHUB_ACCESS_TOKEN}:x-oauth-basic`
      ).toString("base64")}`
    );
    await git.push(["-u", "origin", "master"]);

    process.chdir("..");
  } catch (error) {
    console.error("Error Uploading to GitHub :", error?.message); // GN BRUH ;)
  }
}
async function deployToRender(username, repo, buildPath) {
  return new Promise((resolve, reject) => {
    instance.auth(process.env.RENDER_KEY);

    instance
      .createService({
        type: "static_site",
        autoDeploy: "yes",
        serviceDetails: {
          pullRequestPreviewsEnabled: "no",
          buildCommand: "npm run build",
          publishPath: buildPath,
        },
        name: username,
        ownerId: process.env.RENDER_OWNER_KEY,
        repo: repo,
        branch: "master",
        rootDir: "./",
      })
      .then(({ data }) => {
        const liveLink = data.service.serviceDetails.url;
        // console.log(data.service.serviceDetails.url);
        resolve(liveLink); // Resolve the promise with liveLink
      })
      .catch((err) => {
        console.error(err);
        reject(err); // Reject the promise with the error
      });
  });
}
app.post("/auth", async (req, res) => {
  try {
    const userID = req.body.userID;
    const existingUser = await User.findOne({ userID: userID });
    if (!existingUser) {
      const newUser = new User({
        userID: userID,
        sites: [],
      });
      await newUser.save();
      res.status(200).json({ message: "User authenticated Successfully" });
    }
  } catch (err) {
    console.error("Error authenticating user: ", err);
  }
});
app.get("/user/sites", async (req, res) => {
  const { UserID } = req.query;
  console.log(UserID);
  try {
    const existingUser = await User.findOne({ userID: UserID });
    if (existingUser) {
      if (!existingUser.sites || existingUser.sites.length == 0) {
        res.status(404).json({ message: "no sites found" });
      } else {
        res.json({ sites: existingUser.sites });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.patch("/user/site", async (req, res) => {
  const { UserID, SiteID, Status } = req.body;
  try {
    const existingUser = await User.findOne({ userID: UserID });
    if (existingUser) {
      const existingSite = existingUser.sites.find(
        (site) => site.SiteID === SiteID
      );
      console.log(existingSite);
      if (existingSite) {
        existingSite.Status = Status;
        await existingUser.save();
        res.json({ message: "Status saved successfully" });
      } else {
        res.status(404).json({ error: "Site not found for the user" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/upload", upload.array("file"), async (req, res) => {
  try {
    const [
      newContent,
      assetsFolder,
      filePath,
      repoPath,
      buildPath,
      templateType,
      userID,
    ] = getNewContent(req.body);
    console.log(userID);
    let existingUser = await User.findOne({ userID: userID }).then(
      async (existingUser) => {
        if (existingUser) {
          modifyFile(newContent, filePath);

          let i = 1;
          console.log(req.files?.length, assetsFolder);
          req.files.forEach((file) => {
            const filePath = `${assetsFolder}/pic${i}.png`;
            fs.writeFileSync(filePath, file.buffer);
            i += 1;
          });
          const userName = `${
            req.body.navName ? req.body.navName : "Portfoliify"
          } Portfolio-${PortfolioCount++}`;
          const sourceLink = await createRepository(
            userName,
            repoPath,
            buildPath
          );
          const liveLink = await deployToRender(
            userName,
            sourceLink,
            buildPath
          );
          console.log(sourceLink, liveLink);
          const date = new Date();
          const createdAt = date.toLocaleDateString("en-GB");
          existingUser.sites.push({
            Template: templateType,
            SiteID: uuidv4().toString(),
            Source: sourceLink,
            Link: liveLink,
            CreatedAt: createdAt,
            Status: "Deploying",
          });
          await existingUser.save();
          res
            .status(200)
            .json({
              message: "Site hosted successfully",
              sourceLink: sourceLink,
              createdAt: createdAt,
              templateType: templateType,
              liveLink: liveLink,
            });
        } else {
          console.log("User not found");
          res.status(404).json({ error: "User not found" });
        }
      }
    );
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const firebaseConfig = {
  apiKey: process.env.SERVER_FA_KEY,
  authDomain: process.env.SERVER_FAUTHDOMAIN_KEY,
  projectId: process.env.SERVER_FPID_KEY,
  storageBucket: process.env.SERVER_FS_KEY,
  messagingSenderId: process.env.SERVER_FMSI_KEY,
  appId: process.env.SERVER_FAPPID_KEY,
  measurementId: process.env.SERVER_FMID_KEY,
};

const appF = initializeApp(firebaseConfig);
const auth = getAuth(appF);

app.post("/signup", async (req, res) => {
  try {
    const email = req.body.email;
    const pass = req.body.pass;
    const user = await createUserWithEmailAndPassword(auth, email, pass);
    try {
      const userID = base64_encode(user.user.email);
      const existingUser = await User.findOne({ userID: userID });
      if (!existingUser) {
        const newUser = new User({
          userID: userID,
          sites: [],
        });
        await newUser.save();
      }
    } catch (err) {
      console.error("Error authenticating user: ", err);
    }

    res.send(user.user.email);
  } catch (err) {
    console.log(err);
  }
});
app.post("/signupg", async (req, res) => {
  try {
    const email = req.body.email;
    const userID = base64_encode(email);
    const existingUser = await User.findOne({ userID: userID });
    if (!existingUser) {
      const newUser = new User({
        userID: userID,
        sites: [],
      });
      await newUser.save();
      res.status(200).json({ message: "User authenticated Successfully" });
    }
  } catch (err) {
    console.error("Error authenticating user: ", err);
  }
});
app.post("/signin", async (req, res) => {
  try {
    const email = req.body.email;
    const pass = req.body.pass;
    const user = await signInWithEmailAndPassword(auth, email, pass);
    try {
      const userID = base64_encode(user.user.email);
      const existingUser = await User.findOne({ userID: userID });
      if (!existingUser) {
        const newUser = new User({
          userID: userID,
          sites: [],
        });
        await newUser.save();
      }
    } catch (err) {
      console.error("Error authenticating user: ", err);
    }

    res.send(user.user.email);
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
