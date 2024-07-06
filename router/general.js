const express = require("express");
const fs = require("fs");
let books = require("./booksdb.json");
const path = require("path");
let isValid = require("./auth_users.js").isValid;
const public_users = express.Router();

const readUsersFromFile = () => {
  try {
      const data = fs.readFileSync(usersDbPath, 'utf8');
      return JSON.parse(data);
  } catch (err) {
      console.error('Error reading users database:', err);
      return [];
  }
};

// Path to the users database file
const usersDbPath = path.join(__dirname, "usersdb.json");

// Helper function to write users to usersdb.json
const writeUsersToFile = (users) => {
  try {
    fs.writeFileSync(usersDbPath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing to users database:", err);
  }
};

public_users.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  // Check if the user already exists
  if (!isValid(username))
    res.status(409).json({ message: "Username already exists." });
  else {
    // Add new user
    const users = readUsersFromFile();
    const newUser = { username, password };
    users.push(newUser);
    writeUsersToFile(users);

    return res
      .status(201)
      .json({ message: `User ${username} registered successfully.` });
  }
});

// Get the book list available in the shop
public_users.get("/", function (req, res) {
  return res.status(300).json(books);
});

// Get book details based on ISBN
public_users.get("/isbn/:isbn", function (req, res) {
  const { isbn } = req.params;
  const book = books[isbn];

  if (book) {
    return res.status(300).json(book);
  } else {
    return res.status(404).json({ message: "Book not found." });
  }
});

// Get book details based on author
public_users.get("/author/:author", function (req, res) {
  const author = req.params.author.toLowerCase();
  const matchingBooks = Object.values(books).filter(
    (book) => book.author.toLowerCase() === author
  );

  if (matchingBooks.length > 0) {
    return res.status(300).json(matchingBooks);
  } else {
    return res.status(404).json({ message: "No books found by that author." });
  }
});

// Get all books based on title
public_users.get("/title/:title", function (req, res) {
  const title = req.params.title.toLowerCase();
  const matchingBooks = Object.values(books).filter(
    (book) => book.title.toLowerCase() === title
  );

  if (matchingBooks.length > 0) {
    return res.status(300).json(matchingBooks);
  } else {
    return res.status(404).json({ message: "No books found with that title." });
  }
});

//  Get book review
public_users.get("/review/:isbn", function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    return res.status(300).json(book.reviews);
  } else {
    return res.status(404).json({ message: "Book not found." });
  }
});

module.exports.general = public_users;
