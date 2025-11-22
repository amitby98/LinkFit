# 🏋️ LinkFit

**LinkFit** is a social fitness application that connects fitness enthusiasts and enables them to participate in a 100-day fitness challenge, share their progress, and connect with a community of like-minded individuals.

## 📋 Table of Contents

- [Key Features](#key-features)
- [Technologies](#technologies)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)

---

## ✨ Key Features

### 🎯 100-Day Challenge

- **Daily Challenges**: Receive a new exercise challenge every day for 100 days
- **Progress Tracking**: Track your completed days and overall progress
- **Personalized Exercises**: AI-generated challenges using OpenAI, tailored to your fitness level

### 👥 Social Network

- **Posts & Images**: Share your fitness journey with photos and text
- **Social Interactions**:
  - Like posts
  - Comment and engage in discussions
  - Follow other users
- **User Profiles**: Create a personalized profile with picture, bio, and personal information

### 🏆 Achievements & Badges

- **Badge System**: Earn badges based on achievements and progress
- **Achievement Tracking**: View all your badges and accomplishments
- **Share Achievements**: Share your achievements with the community

### 📊 Dashboard

- **News Feed**: View posts from all users
- **Today's Challenge**: Quick access to the daily challenge
- **Statistics**: View your progress and fitness statistics

### ⭐ Favorites

- Save favorite posts for quick access later

### 🔐 User Authentication

- **Sign Up & Login**: Complete authentication system
- **Firebase Authentication**: Support for Google sign-in
- **Security**: Data protection with JWT tokens

---

## 🛠️ Technologies

### Frontend

- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **React Router** - Page navigation
- **Firebase Auth** - User authentication
- **Axios** - HTTP requests
- **SASS/SCSS** - Advanced styling
- **Font Awesome** - Icons

### Backend

- **Node.js** - Runtime environment
- **Express.js** - API framework
- **TypeScript** - Type-safe development
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Token authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **OpenAI API** - Exercise challenge generation
- **Swagger** - API documentation

### DevOps & Tools

- **Jest** - Unit testing
- **ESLint** - Code quality
- **dotenv** - Environment variables

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Firebase account (for authentication)
- OpenAI API key (for challenge generation)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd LinkFit
```

### Step 2: Install Dependencies

**Backend:**

```bash
cd server
npm install
```

**Frontend:**

```bash
cd ../client
npm install
```

### Step 3: Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/linkfit
# Or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linkfit

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# HTTPS (for production)
HTTPS_PORT=443
```

### Step 4: Run the Server

**Development:**

```bash
cd server
npm run dev
```

**Production:**

```bash
cd server
npm run build
npm start
```

The server will run on `http://localhost:3000`

### Step 5: Run the Client

**Development:**

```bash
cd client
npm run dev
```

The application will run on `http://localhost:5173`

**Build for Production:**

```bash
cd client
npm run build
```

Files will be built to the `server/client-dist/` directory

---

## 📁 Project Structure

```
LinkFit/
├── client/                 # Frontend - React Application
│   ├── src/
│   │   ├── components/    # React Components
│   │   │   ├── Achievements/
│   │   │   ├── Dashboard/
│   │   │   ├── HomePage/
│   │   │   ├── Profile/
│   │   │   ├── Post/
│   │   │   └── ...
│   │   ├── contexts/       # React Contexts
│   │   ├── httpService.ts # HTTP Service
│   │   └── App.tsx        # Main Component
│   ├── public/            # Static Files
│   └── package.json
│
├── server/                 # Backend - Express API
│   ├── src/
│   │   ├── config/        # Configuration (DB, Swagger)
│   │   ├── controllers/   # Controllers
│   │   ├── models/        # MongoDB Models
│   │   ├── routes/        # API Routes
│   │   ├── middleware/   # Middleware (Auth, etc.)
│   │   └── index.ts       # Entry Point
│   ├── uploads/           # Uploaded Files
│   └── package.json
│
└── README.md
```

---

## 📚 API Documentation

After running the server, you can access Swagger documentation at:

```
http://localhost:3000/api-docs
```

### Main API Routes

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/check` - Check user status
- `POST /api/auth/google` - Google sign-in

#### Users

- `GET /api/user` - Get all users
- `GET /api/user/:id` - Get specific user
- `PUT /api/user` - Update profile
- `POST /api/user/upload-picture` - Upload profile picture

#### Posts

- `GET /api/post` - Get all posts (with pagination)
- `POST /api/post` - Create new post
- `PUT /api/post/:id/like` - Like/unlike post
- `DELETE /api/post/:id` - Delete post

#### Comments

- `POST /api/comment` - Add comment
- `DELETE /api/comment/:id` - Delete comment

#### Exercises

- `GET /api/exercises/challenge/:day` - Get challenge for specific day
- `POST /api/exercises/complete` - Mark challenge as completed
- `GET /api/exercises/progress` - Get user progress

---

## 🧪 Testing

Run tests:

```bash
cd server
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

---

## 🎨 Future Features

- [ ] Private messaging between users
- [ ] Fitness groups
- [ ] Custom challenges
- [ ] Integration with fitness devices (Apple Watch, Fitbit)
- [ ] Mobile application (React Native)
- [ ] Notification system
- [ ] Leaderboard and competitions

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT](LICENSE) license.

---

## 👤 Contact

For questions, suggestions, or support, please open an issue on GitHub.

---

## 🙏 Acknowledgments

Thanks to all contributors and users who help make this project successful!

---

**LinkFit** - Connect your fitness with the community! 💪
