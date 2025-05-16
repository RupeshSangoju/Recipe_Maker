# Recipe_Maker
# AI Cooking Chaos Show

![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![React](https://img.shields.io/badge/React-v18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-yellow)
![Render](https://img.shields.io/badge/Deployed-Render-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**AI Cooking Chaos Show** is a fun and interactive web application that generates unique, multilingual recipes using AI. Input ingredients or a recipe name, choose a cooking style and language, and get a detailed recipe with images and a downloadable PDF. Features include step timers, read-aloud instructions, and recipe sharing.

**Live Demo**: [AI Cooking Chaos Show](https://recipe-maker-1-uzmr.onrender.com)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Recipe Generation**: Create recipes from ingredients or names using Groq AI.
- **Multilingual Support**: Recipes in English, Spanish, French, Hindi, and more.
- **Image Generation**: Fetches dish images via Puppeteer from Google Images.
- **PDF Download**: Export recipes as styled PDFs with images.
- **Step Timers**: Interactive timers for cooking steps.
- **Read Aloud**: Voice narration of recipes in selected languages.
- **Authentication**: User signup and login with secure password hashing.
- **Responsive Design**: Built with Chakra UI for a seamless UI/UX.

## Tech Stack

| **Component**      | **Technology**                     |
|--------------------|------------------------------------|
| **Frontend**       | React, Chakra UI, Framer Motion    |
| **Backend**        | Node.js, Express, MongoDB (Mongoose) |
| **APIs**           | Groq SDK (Recipe Generation), Puppeteer (Images) |
| **Utilities**      | Axios, Bcrypt, jsPDF, html2canvas |
| **Deployment**     | Render (Backend & Frontend)        |

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher): [Download](https://nodejs.org/)
- **MongoDB Atlas**: [Create an account](https://www.mongodb.com/cloud/atlas)
- **Groq API Key**: [Get a key](https://console.groq.com/)
- **Google Chrome**: Required for Puppeteer (local image fetching)
- **Git**: [Install Git](https://git-scm.com/)

### Installation

1. **Clone the Repository**:
   
   git clone https://github.com/RupeshSangoju/Recipe_Maker
   cd ai-cooking-chaos-show

2. **Set Up Backend:**:
   cd server
   npm install

3. **Set Up Frontend:**:
    cd ../client
    npm install

## Contributing
Contributions are welcome! To contribute:


**Fork the repository.**

**Create a feature branch:**
git checkout -b feature/YourFeature
**Commit changes**
git commit -m 'Add YourFeature'
**Push to the branch**
git push origin feature/YourFeature
**Open a Pull Request.**

## License

This project is licensed under the MIT License. See the LICENSE file for details.


