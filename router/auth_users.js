const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.json");
const path = require("path");
const regd_users = express.Router();

const usersDbPath = path.join(__dirname, "usersdb.json");

// Helper function to read users from usersdb.json
const readUsersFromFile = () => {
  try {
    const data = fs.readFileSync(usersDbPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users database:", err);
    return [];
  }
};

const isValid = (username) => {
  const users = readUsersFromFile();
  if (users.some((user) => user.username === username)) {
    return false;
  }
  return true;
};

const authenticatedUser = (username, password) => {
  const users = readUsersFromFile();
  const user = users.find((user) => user.username === username);
  if (user) {
    if (user.password === password) return true;
  }
  return false;
};

// Middleware to parse JSON bodies
regd_users.use(express.json());

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate username and password
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Authenticate user
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  // Generate JWT token
  const token = jwt.sign({ username }, "your_jwt_secret", { expiresIn: "1h" });

  // Return the token as a response
  res.status(200).json({ message: "Successfully logged in", token });
});

// Add/Delete a book review
regd_users.route("/auth/review/:isbn")
  .put((req, res) => {
    const username = req.username;

    const isbn = req.params.isbn;
    const review = req.body.review;

    if (!isbn || !review) {
      return res.status(400).json({ message: "ISBN and review content are required." });
    }

    // Update the books database with the review
    if (books[isbn]) {
      books[isbn].reviews = books[isbn].reviews || {};
      books[isbn].reviews[username] = review;

      // Update the books database file
      fs.writeFileSync(path.join(__dirname, 'booksdb.json'), JSON.stringify(books, null, 2));
      return res.status(200).json({ message: `Review added/modified for ISBN ${isbn} by ${username}.` });
    } else {
      return res.status(404).json({ message: "Book not found." });
    }
  })
  .delete((req, res) => {
    const username = req.username;
    const isbn = req.params.isbn;

    if (!isbn) {
      return res.status(400).json({ message: "ISBN is required." });
    }

    // Check if the book exists
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found." });
    }

    // Clear all reviews for the book
    books[isbn].reviews = {};

    // Update the books database file
    fs.writeFileSync(path.join(__dirname, 'booksdb.json'), JSON.stringify(books, null, 2));
    return res.status(200).json({ message: `Reviews deleted for ISBN ${isbn} by ${username}.` });
  });

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
