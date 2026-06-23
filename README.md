# 📰 NarmaNews

<p align="center">
  <a href="https://nodejs.org/" target="_blank">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
  </a>
  <a href="https://expressjs.com/" target="_blank">
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="ExpressJS" />
  </a>
  <a href="https://www.mongodb.com/" target="_blank">
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  </a>
  <a href="https://newsapi.org/" target="_blank">
    <img src="https://img.shields.io/badge/NewsAPI-FF6B6B?style=for-the-badge&logo=rss&logoColor=white" alt="NewsAPI" />
  </a>
  <a href="https://aistudio.google.com/" target="_blank">
    <img src="https://img.shields.io/badge/Google%20Gemini-1A73E8?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini AI" />
  </a>
  <a href="https://cloudinary.com/" target="_blank">
    <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
  </a>
</p>

### 🌟 Welcome to NarmaNews
A modern, dynamic, and fully responsive **Live News Platform** built with Node.js, Express, and MongoDB. The app automatically fetches the latest global news, organizes them into categories, and uses Google Gemini AI to give users quick, easy-to-read smart summaries of any article.

---

## ✨ Features Checklist

### 🔑 User Authentication & Security
* **Register & Login:** Secure account creation with password hashing via `bcrypt`.
* **Email Verification (OTP):** Sends a 6-digit verification code to your email using `nodemailer`.
* **Resend Code:** Option to request a new verification code if the previous one expired.
* **Rate Limiting (DDoS & Brute-Force Protection):** Implemented via `express-rate-limit` to restrict users to a maximum of 60 requests per minute, protecting authentication routes from automated bots and brute-force attacks.
* **Logout:** Securely terminates the session and clears user cookies.

### 👤 Profile Management
* **Personal Profile Page:** View your personal info, account status, and history.
* **Update Username:** Change your display name directly from the dashboard (with custom validation).
* **Change Profile Picture:** Upload and update your avatar seamlessly using `Cloudinary` cloud storage.
* **Delete Account:** Option to completely and permanently wipe your account and data from the system.

### 📰 News Feed & Content Discovery
* **Live News Fetching:** Automated backgrounds tasks fetch new updates from `NewsAPI` every hour.
* **Categorized Content:** News are instantly sorted into smart categories (**Sports, Technology, Health, Business, Entertainment, General**).
* **Smart Search System:** Looking for something specific? Instantly search articles by keywords using native MongoDB regex search.
* **News Ticker:** A live scrolling ticker on the homepage showing the absolute latest breaking updates.
* **Advanced Pagination:** Clean, lightning-fast page switching (`1`, `2`, `...`, `10`) for both news grids and comment sections.

### 💬 Social & AI Interaction
* **AI Article Analysis:** One-click automated summary powered by `Gemini 3.1 Flash Lite`. It explains long, complex news in short, simple English.
* **Add/Remove Favorites:** Save your favorite articles to read later or clear them from your bookmarks list with a single click.
* **Comment System:** Share your thoughts under any article or delete your own comments whenever you want.

### 📱 Layout & Information
* **100% Responsive Frontend:** Beautiful and modern UI designed perfectly for all device sizes (Mobile, Tablet, and Desktop).
* **Essential Static Pages:** Fully formatted **About Us**, **Terms of Service**, and **Privacy Policy** templates built right in.

---

## 🛠️ Technology Stack

| Layer / Service | Technology | What it does |
| :--- | :--- | :--- |
| **Backend Framework** | Node.js / Express.js | Core application server and routing |
| **Database Engine** | MongoDB / Mongoose | Secure data storage, user/article schemas, and native database interactions |
| **AI Summarizer** | Google Gemini API (`gemini-3.1-flash-lite`) | Powers the **Narma AI Engine v3.1 Lite** for smart article summarization |
| **HTTP Client** | Axios | Handles background asynchronous HTTP requests to NewsAPI |
| **Live Data Stream** | NewsAPI | Fetches live global articles and updates in real-time |
| **Media & Cloud Storage**| Cloudinary & Multer | Handles profile image uploads, automatic formatting, and secure cloud hosting |
| **Security & Auth** | bcrypt / Express Sessions / **express-rate-limit** | Secures passwords via cryptographic hashing, manages login sessions, and **implements Rate Limiting (60 req/min) to prevent DDoS attacks and API abuse** |
| **Mailing System** | Nodemailer (Gmail SMTP) | Sends 6-digit email verification codes (OTP) directly to users for secure registration |
| **Task Automation** | Background Sync Timer | Automated background worker that runs periodically to fetch fresh global updates |
| **Frontend UI** | EJS Templates / Clean CSS | Dynamic server-side UI rendering with full responsiveness across all devices |

---

## 📂 Project Structure

```text
├── models/
│   ├── User.js              # User profiles, passwords, and favorite arrays
│   └── Article.js           # News data schema with nested user comments
├── routes/
│   ├── index.js             # Homepage, search engine, categories, and pagination
│   ├── auth.js              # Registration, login, profile uploads, and favorites
│   └── news.js              # Article views, comment management, and AI triggers
├── services/
│   ├── aiService.js         # Google Gemini prompt configuration
│   ├── newsService.js       # Live NewsAPI interaction & DB storage saving
│   └── newsSyncService.js   # Background sync timer and category auto-detector
├── views/                   # Dynamic EJS views (Frontend layout)
├── public/                  # Static assets (Custom stylesheets and images)
├── app.js                   # Main application initialization and middleware
└── db.js                    # Database connection hub
```

# 🚀 Local Installation Guide

Follow these steps to run **NarmaNews** on your local machine.

## 1. Clone the Repository

Clone the project and install all required dependencies:

```bash
git clone https://github.com/narmadito/NarmaNews.git
cd narmanews
npm install
```
---

## 2. Configure Environment Variables

Create a new `.env` file from the provided template:

```bash
cp .env.example .env
```

Open the newly created `.env` file and fill in the required credentials.

---

## 3. Required Services & API Keys

### 📰 NewsAPI

Used for fetching real-time news articles.

1. Create a free account at https://newsapi.org
2. Generate an API key.
3. Add it to your `.env` file:

```env
NEWS_API_KEY=your_key_here
```

### 🤖 Google Gemini

Used for AI-powered article analysis and summarization.

1. Visit https://aistudio.google.com
2. Create a Gemini API key.
3. Add it to your `.env` file:

```env
GEMINI_API_KEY=your_key_here
```

### ☁️ Cloudinary

Used for storing and serving user profile images.

1. Create an account at https://cloudinary.com
2. Obtain your Cloud Name, API Key, and API Secret.
3. Add them to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### ✉️ Gmail App Password

Required for email verification and account notifications.

1. Enable 2-Step Verification in your Google Account.
2. Open "App Passwords".
3. Generate a new app password.
4. Add your email credentials:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

---

## 4. Start the Development Server

Run the application using Nodemon:

```bash
npm run dev
```

Once the server is running, open:

```txt
http://localhost:3000
```

and start exploring **NarmaNews**.



