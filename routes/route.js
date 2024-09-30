const express = require('express');
const router = express.Router();
const mongodb = require('mongodb');
const multer = require('multer');
const sharp = require('sharp');
const fs = require("fs").promises;
const fsSync = require("fs");
const mongoose = require('mongoose');
const User = require('../models/users');
const Blog = require('../models/blogs'); 
const Video = require('../models/video');
const Solution = require('../models/solutions');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require("path");
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');


// Database connection (if needed for other operations)

const mongoClient = mongodb.MongoClient;

const connectDB = async () => {
  try {
    const client = await mongoClient.connect("mongodb://localhost:27017/ch");  
    return client.db("mongodb_gridfs");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
};

// Image upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().getTime() + "_" + file.originalname);
  },
});


const upload = multer({ storage: storage }).single('image');


const solutionUpload = multer({ storage: storage }).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'sectionImages', maxCount: 10 } // Adjust maxCount as needed
]);

// Helper function to delete a file with retries
async function deleteFile(filePath, maxRetries = 5, delay = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fs.unlink(filePath);
      return;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, no need to delete
        return;
      } else if (error.code === 'EBUSY' || error.code === 'EPERM') {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  console.error(`Failed to delete file after ${maxRetries} attempts: ${filePath}`);
}

// Helper function to process an image
async function processImage(file) {
  const filename = file.filename;
  const resizedFilename = 'resized_' + filename;
  const originalPath = path.join(__dirname, '../uploads', filename);
  const resizedPath = path.join(__dirname, '../uploads', resizedFilename);

  try {
    const metadata = await sharp(originalPath).metadata();
    const newWidth = Math.floor(metadata.width / 2);
    const newHeight = Math.floor(metadata.height / 2);
    
    await sharp(originalPath)
      .resize(newWidth, newHeight)
      .jpeg({ quality: 95 })
      .toFile(resizedPath);

    // Delete the original file
    await deleteFile(originalPath);

    return resizedFilename;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

// Route to get an image by filename
router.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, '../uploads', filename);
  
  if (fsSync.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});



router.post("/add", upload, async (req, res) => {
  try {
    const file = req.file;
    const name = req.body.name;
    const title = req.body.title;
    const paragraph1 = req.body.paragraph1;
    const paragraph2 = req.body.paragraph2;
    
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Retrieve existing user or create a new one
    let user = await User.findOne({ name }) || new User({ name });

    // Resize the image
    const metadata = await sharp(file.path).metadata();
    const newWidth = Math.floor(metadata.width / 2);
    const newHeight = Math.floor(metadata.height / 2);
    const resizedImagePath = path.join(__dirname, '../uploads', 'resized_' + file.filename);
    
    await sharp(file.path)
      .resize(newWidth, newHeight)
      .jpeg({ quality: 95 })
      .toFile(resizedImagePath);

    // Update user details
    user.title = title;
    user.image = 'resized_' + file.filename;
    user.paragraph1 = paragraph1;
    user.paragraph2 = paragraph2;
    await user.save();

    // Delete old image if it exists
    if (user.image && user.image !== 'resized_' + file.filename) {
      const oldImagePath = path.join(__dirname, '../uploads', user.image);
      await deleteFile(oldImagePath);
    }

    // Delete temporary original file
    await deleteFile(file.path);

    // Redirect to the home page
    res.redirect('/');

  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




router.post("/add2", upload, async (req, res) => {
  try {
    const file = req.file;
    const name = req.body.name;
    const title = req.body.title;
    const paragraph1 = req.body.paragraph1;
    const paragraph2 = req.body.paragraph2;
    
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Retrieve existing user or create a new one
    let user = await User.findOne({ name }) || new User({ name });

    // Resize the image
    const metadata = await sharp(file.path).metadata();
    const newWidth = Math.floor(metadata.width / 2);
    const newHeight = Math.floor(metadata.height / 2);
    const resizedImagePath = path.join(__dirname, '../uploads', 'resized_' + file.filename);
    
    await sharp(file.path)
      .resize(newWidth, newHeight)
      .jpeg({ quality: 95 })
      .toFile(resizedImagePath);

    // Update user details
    user.title = title;
    user.image = 'resized_' + file.filename;
    user.paragraph1 = paragraph1;
    user.paragraph2 = paragraph2;
    await user.save();

    // Delete old image if it exists
    if (user.image && user.image !== 'resized_' + file.filename) {
      const oldImagePath = path.join(__dirname, '../uploads', user.image);
      await deleteFile(oldImagePath);
    }

    // Delete temporary original file
    await deleteFile(file.path);

    // Redirect to the home page
    res.redirect('/');

  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});






router.post("/blog", upload, async (req, res) => {
  try {
    const file = req.file;
    const {
      title,
      content,
      'seo-url': seoUrl,
      'seo-tags': seoTags,
      'seo-description': seoDescription,
      'seo-title': seoTitle,
      'seo-keywords': seoKeywords,
      blogType,
      bakeTemp,
      mixingTimeMin,
      mixingTimeMax,
      bakeTimeMin,
      bakeTimeMax,
      prepTimeMin,
      prepTimeMax,
      recipeDescription,
      ingredients,
      method,
      productUrls
    } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

     // Generate a unique seoUrl
     let uniqueSeoUrl = seoUrl.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
     let counter = 1;
     while (await Blog.findOne({ 'seo.url': uniqueSeoUrl })) {
       uniqueSeoUrl = `${seoUrl}-${counter}`;
       counter++;
     }

    const filename = new Date().getTime() + "_" + file.originalname;
    const resizedFilename = 'resized_' + filename;
    const resizedImagePath = path.join(__dirname, '../uploads', resizedFilename);

    // Process the image with Sharp
    const metadata = await sharp(file.path).metadata();
    const newWidth = Math.floor(metadata.width / 2);
    const newHeight = Math.floor(metadata.height / 2);
    await sharp(file.path)
      .resize(newWidth, newHeight)
      .jpeg({ quality: 95 })
      .toFile(resizedImagePath);

    // Create new blog post
    const newBlog = new Blog({
      title,
      content,
      description: recipeDescription,
      ingredients: ingredients,
      method: method,
      productUrls: Array.isArray(productUrls) ? productUrls : [productUrls],
      image: resizedFilename,
      blogType,
      seo: {
        url: uniqueSeoUrl,  // Store the unique SEO URL
        tags: seoTags.split(',').map(tag => tag.trim()),
        description: seoDescription,
        title: seoTitle,
        keywords: seoKeywords.split(',').map(keyword => keyword.trim())
      },
      recipeDetails: blogType === 'recipe' ? {
        description: recipeDescription, 
        ingredients,
        method,
        productUrls: Array.isArray(productUrls) ? productUrls : [productUrls],
        bakeTemp: Number(bakeTemp),
        mixingTime: {
          min: Number(mixingTimeMin),
          max: Number(mixingTimeMax)
        },
        bakeTime: {
          min: Number(bakeTimeMin),
          max: Number(bakeTimeMax)
        },
        prepTime: {
          min: Number(prepTimeMin),
          max: Number(prepTimeMax)
        }
      } : undefined
    });
    await newBlog.save();

    
   // Delete the original uploaded file
   await deleteFile(file.path);

    res.redirect('/');
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }finally {
    // Cleanup the original uploaded file
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error("Error cleaning up file:", err);
      }
    }
  }
});



// Route to handle solution creation
router.post("/solution", solutionUpload, async (req, res) => {
  try {
    const mainImageFile = req.files['mainImage'] ? req.files['mainImage'][0] : null;
    const sectionImageFiles = req.files['sectionImages'] || [];

    if (!mainImageFile) {
      return res.status(400).json({ error: "No main image uploaded" });
    }

    const {
      title,
      shortDescription,
      longDescription,
      'seo-url': seoUrl,
      'seo-tags': seoTags,
      'seo-keywords': seoKeywords,
      sections
    } = req.body;

    // Process main image
    const mainImageFilename = await processImage(mainImageFile);

    // Generate a unique seoUrl
    let uniqueSeoUrl = seoUrl;
    let counter = 1;
    while (await Solution.findOne({ 'seo.url': uniqueSeoUrl })) {
      uniqueSeoUrl = `${seoUrl}-${counter}`;
      counter++;
    }

    // Process sections and their images
    const processedSections = await Promise.all(
      JSON.parse(sections).map(async (section, index) => {
        let imageFilename = null;
        if (sectionImageFiles[index]) {
          imageFilename = await processImage(sectionImageFiles[index]);
        }
        return {
          title: section.title,
          description: section.description,
          image: imageFilename
        };
      })
    );

    // Create new solution
    const newSolution = new Solution({
      title,
      shortDescription,
      longDescription,
      image: mainImageFilename,
      sections: processedSections,
      seo: {
        url: uniqueSeoUrl,
        tags: seoTags.split(',').map(tag => tag.trim()),
        keywords: seoKeywords.split(',').map(keyword => keyword.trim())
      },
      created_at: new Date(),
      updated_at: new Date()
    });

    await newSolution.save();

    res.redirect('/'); // Redirect to home page or wherever you want
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get('/solutionDetails/:seoUrl', async (req, res) => {
  try {
    const { seoUrl } = req.params;

    // Find the solution by its SEO URL
    const solution = await Solution.findOne({ 'seo.url': seoUrl });

    if (!solution) {
      return res.status(404).render('error', { message: 'Solution not found' });
    }

    // Render the solutionDetails EJS template with the full solution object
    res.render('solutionDetails', { solution });

  } catch (err) {
    console.error('Error fetching solution details:', err);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
});


// Assuming Blog is your model
router.get('/latestBlogs', async (req, res) => {
  try {
    const latestBlogs = await Blog.find().sort({ created_at: -1 }).limit(3);
    res.json(latestBlogs);
  } catch (error) {
    console.error('Error fetching latest blogs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






router.get('/blogDetails/:seoUrl', async (req, res) => {
  try {
    const seoUrl = req.params.seoUrl;
    const blog = await Blog.findOne({ 'seo.url': seoUrl });
    
    if (!blog) {
      return res.status(404).send('Blog not found');
    }
    
    const recommendedItems = await Blog.find({ 
      blogType: blog.blogType, 
      'seo.url': { $ne: seoUrl } 
    }).limit(3);
    
    function formatTimeRange(timeRange) {
      if (timeRange.min === timeRange.max) {
        return timeRange.min;
      } else {
        return `${timeRange.min}-${timeRange.max}`;
      }
    }
    
    res.render('blogDetails', { blog, recommendedItems, formatTimeRange });
  } catch (error) {
    console.error("Error fetching blog details:", error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/api/productDetails/:blogId', async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId);
    if (!blog || !blog.recipeDetails || !blog.recipeDetails.productUrls) {
      return res.status(404).json({ error: 'Blog or product URLs not found' });
    }

    let products = [];
    for (let productUrl of blog.recipeDetails.productUrls) {
      try {
        const productResponse = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const html = productResponse.data;
        const $ = cheerio.load(html);
        let product = {
          title: $('#protitle').text().trim(),
          image: $('.flexslider .slide a').first().attr('href'),
          additionalImage: '',
          description: '',
          url: productUrl
        };
        product.description = $('.descrp-content .fnt-14').html();
        product.keyIngredients = $('h2:contains("Key Ingredients")').next('p.fnt-14').text().trim();
        
        const additionalImageElement = $('.flexslider .slide a').eq(1);
        if (additionalImageElement.length) {
          product.additionalImage = additionalImageElement.attr('href');
        }

        if (product.image && !product.image.startsWith('http')) {
          product.image = new URL(product.image, productUrl).href;
        }
        if (product.additionalImage && !product.additionalImage.startsWith('http')) {
          product.additionalImage = new URL(product.additionalImage, productUrl).href;
        }

        products.push(product);
      } catch (error) {
        console.error("Error fetching product details:", error.message);
      }
    }
    res.json(products);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



//update blogs 

router.post('/blog/update/:id', upload, async (req, res) => {
  const id = req.params.id;
  let newImage = '';

  try {
    if (req.file) {
      const file = req.file;
      const filename = new Date().getTime() + "_" + file.originalname;
      const resizedFilename = 'resized_' + filename;
      const resizedImagePath = path.join(__dirname, '../uploads', resizedFilename);

      // Process the image with Sharp
      const metadata = await sharp(file.path).metadata();
      const newWidth = Math.floor(metadata.width / 2);
      const newHeight = Math.floor(metadata.height / 2);
      await sharp(file.path)
        .resize(newWidth, newHeight)
        .jpeg({ quality: 95 })
        .toFile(resizedImagePath);

      newImage = resizedFilename;

      if (req.body.old_image) {
        const oldImagePath = path.join(__dirname, '../uploads', req.body.old_image);
        
        // Try to delete the old image
        await deleteFile(oldImagePath);
      }

      // Delete the original uploaded file
      await deleteFile(file.path);
    } else {
      newImage = req.body.old_image;
    }

    const blogData = {
      title: req.body.title,
      content: req.body.content,
      image: newImage,
      blogType: req.body.blogType,
      seo: {
        url: req.body.seo_url,
        tags: req.body.seo_tags.split(',').map(tag => tag.trim()),
        description: req.body.seo_description,
        title: req.body.seo_title,
        keywords: req.body.seo_keywords.split(',').map(keyword => keyword.trim())
      }
    };

    if (req.body.blogType === 'recipe') {
      blogData.recipeDetails = {
        description: req.body.recipeDescription,
        bakeTemp: Number(req.body.bakeTemp),
        mixingTime: {
          min: Number(req.body.mixingTimeMin),
          max: Number(req.body.mixingTimeMax)
        },
        bakeTime: {
          min: Number(req.body.bakeTimeMin),
          max: Number(req.body.bakeTimeMax)
        },
        prepTime: {
          min: Number(req.body.prepTimeMin),
          max: Number(req.body.prepTimeMax)
        },
        method: req.body.method,
        productUrls: Array.isArray(req.body.productUrls) ? req.body.productUrls : [req.body.productUrls]
      };
    }

    const result = await Blog.findByIdAndUpdate(id, blogData, { new: true });

    if (!result) {
      return res.status(404).json({ message: "Blog not found", type: 'danger' });
    }

    req.session.message = {
      type: 'success',
      message: 'Blog updated successfully!'
    };
    res.redirect('/blogs');
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: err.message, type: 'danger' });
  }
});





router.get('/up_blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }); // Fetch all blogs, sorted by creation date

    res.render('updateBlog', {
      title: 'Blog List',
      blogs: blogs,
      message: req.session.message
    });

    delete req.session.message; // Clear the message after displaying
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Route to display the edit form
router.get('/edit/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      req.session.message = {
        type: 'danger',
        message: 'Blog not found'
      };
      return res.redirect('/blogs');
    }
    res.render('editBlog', { blog: blog, message: req.session.message });
  } catch (err) {
    console.error(err);
    req.session.message = {
      type: 'danger',
      message: 'Error occurred while fetching the blog'
    };
    res.redirect('/blogs');
  }
});


router.get('/update_solutions', async (req, res) => {
  try {
    const solutions = await Solution.find().sort({ updated_at: -1 }); // Fetch all solutions, sorted by update date

    res.render('updateSolution', {
      title: 'Solution List',
      solutions: solutions,
      message: req.session.message
    });

    delete req.session.message; // Clear the message after displaying
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Route to display edit form
router.get("/solution/edit/:id", async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) {
      return res.status(404).send("Solution not found");
    }
    res.render('editSolution', { solution }); // Create this view
  } catch (err) {
    console.error("Error fetching solution:", err);
    res.status(500).send("Server error");
  }
});




// Route to handle solution update
router.post("/solution/update/:id", solutionUpload, async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) {
      return res.status(404).json({ error: "Solution not found" });
    }

    const mainImageFile = req.files['mainImage'] ? req.files['mainImage'][0] : null;
    const sectionImageFiles = req.files['sectionImages'] || [];

    const {
      title,
      shortDescription,
      longDescription,
      'seo-url': seoUrl,
      'seo-tags': seoTags,
      'seo-keywords': seoKeywords,
      sections
    } = req.body;

    // Process main image if a new one is uploaded
    let mainImageFilename = solution.image;
    if (mainImageFile) {
      mainImageFilename = await processImage(mainImageFile);
      // Delete old image file here if needed
    }

    // Generate a unique seoUrl if it has changed
    let uniqueSeoUrl = seoUrl;
    if (uniqueSeoUrl !== solution.seo.url) {
      let counter = 1;
      while (await Solution.findOne({ 'seo.url': uniqueSeoUrl, _id: { $ne: solution._id } })) {
        uniqueSeoUrl = `${seoUrl}-${counter}`;
        counter++;
      }
    }

    // Process sections and their images
    const parsedSections = JSON.parse(sections);
    const processedSections = await Promise.all(
      parsedSections.map(async (section, index) => {
        let imageFilename = section.image; // Keep existing image if no new one uploaded
        if (sectionImageFiles[index]) {
          imageFilename = await processImage(sectionImageFiles[index]);
          // Delete old section image file here if needed
        }
        return {
          title: section.title,
          description: section.description,
          image: imageFilename
        };
      })
    );

    // Update solution
    solution.title = title;
    solution.shortDescription = shortDescription;
    solution.longDescription = longDescription;
    solution.image = mainImageFilename;
    solution.sections = processedSections;
    solution.seo = {
      url: uniqueSeoUrl,
      tags: seoTags.split(',').map(tag => tag.trim()),
      keywords: seoKeywords.split(',').map(keyword => keyword.trim())
    };
    solution.updated_at = new Date();

    await solution.save();

    res.redirect('/'); // Redirect to home page or solution detail page
  } catch (err) {
    console.error("Error updating solution:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.post("/login", async (req, res) => {
  console.log("Reached /login route");

  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      console.log("Admin not found");
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      console.log("Invalid password");
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    req.session.user = { username: admin.username };
    console.log("Login successful");
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect("/login");
  }
}



router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});




// Add this new route for global search
router.get('/search', async (req, res) => {
  try {
      const searchQuery = req.query.q; // Get the search query from the URL parameter

      // Search in blogs
      const blogs = await Blog.find({
          $or: [
              { title: { $regex: searchQuery, $options: 'i' } },
              { content: { $regex: searchQuery, $options: 'i' } }
          ]
      }).limit(10); // Limit to 10 results for performance

      // Search in solutions
      const solutions = await Solution.find({
          $or: [
              { title: { $regex: searchQuery, $options: 'i' } },
              { shortDescription: { $regex: searchQuery, $options: 'i' } }
          ]
      }).limit(10); // Limit to 10 results for performance

      // Render the search results page
      res.render('searchResults', { blogs, solutions, searchQuery });
  } catch (error) {
      console.error('Search error:', error);
      res.status(500).send('An error occurred while searching');
  }
});





router.get('/add', (req, res) => {

  res.render('add_user'); // Assuming you have an EJS file named add_user.ejs for the form
});

router.get('/aboutus', (req, res) => {

  res.render('aboutus'); // Assuming you have an EJS file named add_user.ejs for the form
});

router.post('/youtube', async (req, res) => {
  const { name, url } = req.body;

  try {
    // Find the most recently added video
    let video = await Video.findOne().sort({ createdAt: -1 });

    if (video) {
      // If a video exists, update its name and URL
      video.name = name;
      video.url = url;
    } else {
      // If no video exists, create a new one
      video = new Video({ name, url });
    }

    // Save the video document (either update or insert)
    await video.save();

    res.redirect('/'); // Redirect to home page or wherever appropriate
  } catch (error) {
    console.error('Error saving or updating video:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to get all blogs with optional filtering
router.get('/blogs', async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};

    // Filter by blogType if 'type' is 'article' or 'recipe'
    if (type && ['article', 'recipe'].includes(type)) {
      query.blogType = type;
    }

    // Find blogs matching the query, sorted by creation date in descending order
    const blogs = await Blog.find(query).sort({ created_at: -1 });

   

    // Render the blogs.ejs template and pass the blogs data along with the current filter type
    res.render('blogs', { blogs, currentType: type || 'all' });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).send('Server error');
  }
});

// Route to get all solutions
router.get('/solutions', async (req, res) => {
  try {
    // Fetch all solutions from the database
    const solutions = await Solution.find();

    // Render the solutions.ejs template and pass the solutions data
    res.render('solutions', { solutions });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

router.post('/cookie-consent', (req, res) => {
  const consent = req.body;

  if (typeof consent !== 'object') {
    return res.status(400).send('Invalid consent data');
  }

  const cookieOptions = {
    maxAge: 365 * 24 * 60 * 60 * 1000, // Set cookie for 1 year
    httpOnly: true, // Makes the cookie inaccessible to client-side scripts
    secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS in production
    sameSite: 'strict' // Prevents the cookie from being sent in cross-site requests
  };

  // Set individual cookies for each preference
  for (const [key, value] of Object.entries(consent)) {
    res.cookie(`cookieConsent_${key}`, value.toString(), cookieOptions);
  }

  res.sendStatus(200);
});

router.get('/', async (req, res, next) => {
  try {
    const [users, latestBlogs, uploadedVideos, solutions] = await Promise.all([
      User.find(),
      Blog.find().sort({ createdAt: -1 }).limit(3),
      Video.find().select('name url'),
      Solution.find().limit(4)
    ]);

    let cookieConsent = null;
    if (req.cookies.cookieConsent) {
      try {
        cookieConsent = JSON.parse(req.cookies.cookieConsent);
      } catch (e) {
        // If parsing fails, it's likely an old format cookie
        cookieConsent = { all: req.cookies.cookieConsent === 'accepted' };
      }
    }

    res.render('home', { 
      users, 
      blogs: latestBlogs, 
      videos: uploadedVideos, 
      solutions,
      cookieConsent
    });
  } catch (error) {
    console.error('Error fetching users, blogs, videos, or solutions:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Error handling middleware
router.use((err, req, res, next) => {
  if (res.headersSent) {
      return next(err);
  }
  res.status(500);
  res.render('error', { error: err });
});







// Handle both GET and POST requests for deletion
router.all("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    // Delete the blog post
    await Blog.findByIdAndDelete(id);

    // Check if the blog has an associated image
    if (blog.image) {
      try {
        // Construct the full path to the image
        const imagePath = path.join(__dirname, '../uploads', blog.image);
        // Remove the image file from the server
        await fs.unlink(imagePath);
      } catch (err) {
        console.error("Error deleting image file:", err);
        // Optionally handle file deletion errors, e.g., log or notify
      }
    }

    // If it's an AJAX request, send JSON response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: "Blog deleted successfully!" });
    }

    // For non-AJAX requests, set a session message and redirect
    req.session.message = {
      type: "info",
      message: "Blog deleted successfully!",
    };

    // Redirect to the blog list page
    res.redirect("/up_blogs");
  } catch (err) {
    console.error("Error deleting blog:", err);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(500).send("Server error");
  }
});










module.exports = router;
