const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const USER_ID_LENGTH = 8;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "10425624": {
    id: "10425624", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "75839105": {
    id: "75839105", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
 }
};

app.set("view engine", "ejs");
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

//====================== POST ======================\\

app.post("/urls", (req, res) => {
  console.log(req.body);
  const newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  if (!email) {
    return res.status(400).end('Cannot register with empty email')
  }

  if (!password) {
    return res.status(400).end('Cannot register with empty password.')
  }

  if (userExists("email", email)) {
    return res.status(400).end(`Email account ${email} already exists.`)
  }

  const id = generateRandomString(USER_ID_LENGTH);
  users[id] = { id, email, password };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//====================== GET ======================\\

app.get("/", (req, res) => {
  if (req.cookies[username]) {
    return res.redirect('/urls');
  }

  res.redirect('/login');
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];

  if (longURL === undefined) {
    res.statusCode = 404;
    return res.end('URL requested not found.');
  }

  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  console.log(templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.statusCode = 404;
    return res.end('URL requested not found.');
  }

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body> Hello <b>World</b></body></html>\n");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

const generateRandomString = (stringLength) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = upper.toLocaleLowerCase();
  const digits = "0123456789";
  const alphanumeric = upper + lower + digits;
  let randomString = '';

  for (let i = 0; i < stringLength; i++) {
    randomString += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  
  return randomString;
};

const userExists = (field, value) => {
  for (const userID in users) {
    if (users[userID][field] === value) return true;
  }

  return false;
};