const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    description: "Title of the section",
    example: "Feature Overview"
  },
  description: {
    type: String,
    required: true,
    description: "Description of the section",
    example: "A brief overview of the main features of our CRM solution."
  },
  image: {
    type: String,
    required: true,
    description: "Image filename for the section",
    example: "feature-overview-image.jpg"
  }
});

const solutionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    description: "Title of the solution",
    example: "Comprehensive CRM Solution"
  },
  shortDescription: {
    type: String,
    required: true,
    description: "Brief description of the solution",
    example: "A robust CRM system to manage customer relationships effectively."
  },
  longDescription: {
    type: String,
    required: true,
    description: "Detailed description of the solution",
    example: "This solution provides comprehensive CRM functionalities including customer data management, analytics, and automated follow-ups."
  },
  image: {
    type: String,
    required: true,
  },
  sections: {
    type: [sectionSchema],
    default: [],
    description: "Array of sections for the solution",
  },
  seo: {
    url: {
      type: String,
      required: true,
      unique: true,
      description: "SEO-friendly URL for the solution",
      example: "comprehensive-crm-solution"
    },
    keywords: [{
      type: String,
      description: "SEO keywords related to the solution",
      example: "CRM software, customer relationship management, sales automation"
    }],
    tags: [{
      type: String,
      description: "SEO tags associated with the solution",
      example: "CRM, software, customer management"
    }]
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "The date when the solution was created",
    example: "2023-06-20T14:48:00.000Z"
  },
  updated_at: {
    type: Date,
    description: "The date when the solution was last updated",
    example: "2023-06-22T10:30:00.000Z"
  }
});

const Solution = mongoose.model('Solution', solutionSchema);

module.exports = Solution;