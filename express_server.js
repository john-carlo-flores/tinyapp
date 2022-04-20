const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const USER_ID_LENGTH = 8;

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "KAQ4o7zG"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "WkmEiZJb"
  }
};

const users = {
  "KAQ4o7zG": {
    id: "KAQ4o7zG", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "WkmEiZJb": {
    id: "WkmEiZJb", 
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
  if (!req.cookies.user_id) {
    return res.status(403).send('Only users logged in can create shortened URLs. Go <a href="/">back</a>.');
  }

  const newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  }  
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send('Only users logged in can delete shortened URLs. Go <a href="/">back</a>.');
  }

  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(401).send(`Cannot delete ${req.params.id} because you do not have ownership. Go <a href="/urls">back</a>.`);
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send('Only users logged in can edit shortened URLs. Go <a href="/">back</a>.');
  }

  if (urlDatabase[req.params.id].userID !== req.cookies.user_id) {
    return res.status(401).send(`Cannot edit ${req.params.id} because you do not have ownership. Go <a href="/urls">back</a>.`);
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByKeyValue("email", email);

  if (!user) {
    return res.status(403).send('User with email does not exist. Go <a href="/login">back</a>.');
  }

  if (user.password !== password) {
    return res.status(403).send('Incorrect password. Go <a href="/login">back</a>.');
  }

  res.cookie('user_id', user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  if (!email) {
    return res.status(400).send('Cannot register with empty email. Go <a href="/register">back</a>.')
  }

  if (!password) {
    return res.status(400).send('Cannot register with empty password. Go <a href="/register">back</a>.')
  }
  
  const user = getUserByKeyValue("email", email);

  if (user) {
    return res.status(400).send(`Email account ${email} already exists. Go <a href="/register">back</a>.`)
  }

  const id = generateRandomString(USER_ID_LENGTH);
  users[id] = { id, email, password };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//====================== GET ======================\\

app.get("/", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }

  res.redirect('/login');
});

app.get("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(401).render('urls_no-access', { user: undefined });
  }

  const templateVars = { urls: urlsForUser(req.cookies.user_id), user: users[req.cookies.user_id] };
  console.log(templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect('/login');
  }

  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(401).render('urls_no-access', { user: undefined });
  }

  if (urlDatabase[req.params.shortURL].userID !== req.cookies.user_id) {
    return res.status(401).send(`Unable to access ${req.params.shortURL} because you do not have ownership. Go <a href="/">back</a>.`);
  }


  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.status(404).send('URL requested not found. Go <a href="/">back</a>.');
  }

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (longURL === undefined) {
    return res.status(404).send('URL requested not found. Go <a href="/">back</a>.');
  }

  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }

  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }

  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_login", templateVars)
})

//====================== LISTEN ======================\\

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

//====================== HELPER ======================\\

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

const getUserByKeyValue = (key, value) => {
  for (const userID in users) {
    if (users[userID][key] === value) {
      return users[userID];
    }
  }
};

const urlsForUser = (id) => {
  const newData = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      newData[shortURL] = urlDatabase[shortURL].longURL;
    }
  }

  return newData;
};