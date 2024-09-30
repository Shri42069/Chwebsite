const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    description: "URL of the blog post's main image",
    example: "https://example.com/images/blog-post.jpg"
  },
  title: {
    type: String,
    required: true,
    description: "Title of the blog post",
    example: "How to Write a Blog Post"
  },
  content: {
    type: String,
    required: true,
    description: "Main content of the blog post or ingredients for recipe",
  },
  blogType: {
    type: String,
    enum: ['article', 'recipe'],
    required: true
  },
  recipeDetails: {
    bakeTemp: {
      type: Number,
      required: function() { return this.blogType === 'recipe'; }
    },
    method: {
      type: String,
      required: function() { return this.blogType === 'recipe'; }
    },
    mixingTime: {
      min: {
        type: Number,
        required: function() { return this.blogType === 'recipe'; }
      },
      max: {
        type: Number,
        required: function() { return this.blogType === 'recipe'; }
      }
    },
    bakeTime: {
      min: {
        type: Number,
        required: function() { return this.blogType === 'recipe'; }
      },
      max: {
        type: Number,
        required: function() { return this.blogType === 'recipe'; }
      }
    },
    prepTime: {
      min: {
        type: Number,
        required: function() { return this.blogType === 'recipe'; }
      },
      max: {
        type: Number,
        required: function() { return this.blogType === 'recipe'; }
      }
    },
    description:{
      type: String,
      required: function() { return this.blogType === 'recipe'; }
      
    },
    productUrls: [{  // Changed from productUrl to productUrls
      type: String,
      trim: true
    }],
  },
  seo: {
    tags: [{
      type: String,
      description: "SEO tags associated with the blog post",
      example: "['blogging', 'writing tips']"
    }],
    url: {
      type: String,
      required: true,
      unique: true,
      description: "SEO optimized URL slug for the blog post",
      example: "how-to-write-a-blog-post"
    },
    description: {
      type: String,
      description: "Meta description for SEO",
      example: "Learn how to write an engaging blog post that attracts readers..."
    },
    title: {
      type: String,
      description: "SEO meta title",
      example: "How to Write a Blog Post - A Comprehensive Guide"
    },
    keywords: [{
      type: String,
      description: "Keywords for SEO",
      example: "['blog writing', 'SEO tips', 'content creation']"
    }]
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "The date when the blog post was created",
    example: "2023-06-20T14:48:00.000Z"
  },
  updated_at: {
    type: Date,
    description: "The date when the blog post was last updated",
    example: "2023-06-22T10:30:00.000Z"
  }
});

// Add a virtual property for a single productUrl (for backwards compatibility)
blogSchema.virtual('recipeDetails.productUrl').get(function() {
  return this.recipeDetails.productUrls[0];
});

blogSchema.virtual('recipeDetails.productUrl').set(function(v) {
  if (!this.recipeDetails.productUrls) {
    this.recipeDetails.productUrls = [];
  }
  this.recipeDetails.productUrls[0] = v;
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;