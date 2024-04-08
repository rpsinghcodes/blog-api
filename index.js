const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require('dotenv');
dotenv.config();
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protectedRoutes");
const verifyToken = require("./middleware/authMiddleware");

const app = express();
app.use(express.json());

app.use(authRoutes);
app.use("/protected", protectedRoutes);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // allow all domains
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  next();
});

const commentSchema = new mongoose.Schema({
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  comments: [commentSchema],
  timestamp: { type: Date, default: Date.now },
});

mongoose
  .connect(process.env.DATABASE_URL, { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));
const BlogPost = mongoose.model("BlogPost", blogSchema);

mongoose.connection.on("error", (err) => {
  console.log(err);
});

//get all the documents
app.get("/", async (req, res) => {
  const data = await BlogPost.find({});
  console.log("data: ", data);
  res.send(data);
});

// get a specific blog
app.get("/blog/:id", async (req, res) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id }).exec();
    if (post) {
      res.send(post);
    } else {
      res.status(401).json({ message: "Blog Not found" });
    }
  } catch (err) {
    console.log("Blog not found.");
    res.status(401).json({ message: "Blog Not found." });
  }
});

// adding new comments
app.put("/add-comment/:id", async (req, res) => {
  const { id } = req.params;
  console.log('req.body.content: ', req.body.content);
  if(!req.body.content) {
    res.status(404).json({message:"Please provide a valid data."});
  }
  if(req.body.content) {

  BlogPost.findById(id)
  .then(blog => {
    if (!blog) {
      console.error('Blog not found');
      res.status(400).json({message:"Blog not found."})
      return;
    }

    // Push the new comment into the comments array
    blog.comments.push({content: req.body.content});

    // Save the blog with the new comment
    return blog.save();
  })
  .then(updatedBlog => {
    res.status(200).json({message:"Comment added to blog."})
  })
  .catch(err => {
    console.error('Error:', err);
    res.status(400).json({message:"Error in adding comment."})
  });
  

}
});

// only works when the user has a valid token
app.post("/api/blog", verifyToken, async (req, res) => {
  if (req.body.title && req.body.content && req.body.author) {
    let blogPost = new BlogPost({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
    });
    blogPost = await blogPost.save();

    res.status(200).json({ message: "Data saved succesfully." });
  } else {
    return res.status(404).json({ message: "Invalid data provided." });
  }
});

app.put('/update-blog/:id', verifyToken, async (req, res) => {

  if(!req.params.id) {
    res.status(400).json({message:"Send a valid id."});
  }
  const id = req.params.id;

  if(!req.body.title && !req.body.content && !req.body.author){
    res.status(404).json({message:"Invalid Data."});
  } if (req.body.title && req.body.content && req.body.author) {
    const newContent = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
  
    }

    try {
      const updated = await BlogPost.findOneAndUpdate({_id:id}, newContent);
      if(!updated) {
        res.status(400).json({message:"Can\'t update blog."})
      } if(updated) {
        res.status(200).json({message: "Blog updated Succesfully."})
      }
    } catch(err) {
      console.log('err: ', err);
      res.status(400).json({message:"Error in updating."});
    }
  

  }
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

module.exports = BlogPost;
