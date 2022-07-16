// Settings
const express = require("express");
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['CaNt#HaCk%ThIs^BaDdIes', 'VeRyEnCrYpTeD#PaSsW0rd'],
  maxAge: 24 * 60 * 60 * 1000
})); // read cookies (needed for auth)

app.use(express.urlencoded({ extended: true })); // used for form data
const bcrypt = require("bcryptjs");  // used to hash passwords
const salt = bcrypt.genSaltSync(10);

const {getUserDb, generateRandomString, addLinkToDatabase, urlCheck, verifyUser, getUserByCookie, getUserByEmail, getUrlbyId} = require('./helpers.js');



// DataBase

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "admin",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const usersDatabase = {
  admin: {
    id: "admin",
    email: "admin@admin.io",
    password: bcrypt.hashSync("admin", salt)
  },

};

// Gets

// Will access list of URLs if logged in or send msg asking user to log-in
app.get("/urls", (req, res) => {
  const state = req.session.user_id;
  if (!state) {
    res.send("Please login to view your URLs");
  } else {
    let currentDb = getUserDb(req.session.user_id, urlDatabase);
    const templateVars = { urls: currentDb, user: getUserByCookie(req.session.user_id, usersDatabase) };
    res.render("urls_index", templateVars);
  }
});

// Will redirect to login page if not logged in or URLs if logged in
app.get("/", (req, res) => {
  const state = req.session.user_id;
  if (!state) {
    res.redirect("/login");
  } else {
    let currentDb = getUserDb(req.session.user_id, urlDatabase);
    const templateVars = { urls: currentDb, user: getUserByCookie(req.session.user_id, usersDatabase) };
    res.render("urls_index", templateVars);
  }
});

// Allows to create new URL and adds them to the global URL database or redirects to login page if not logged in
app.get("/urls/new", (req, res) => {
  const state = req.session.user_id;
  if (!state) {
    res.redirect("/login");
  } else {
    const templateVars = { user: getUserByCookie(req.session.user_id, usersDatabase) };
    res.render("urls_new", templateVars);
  }
});

// View individual URL and allows to edit or send error msg if it doesn't exist, not logged in or if it doesn't belong to user
app.get("/urls/:id", (req, res) => {
  const state = req.session.user_id;
  let currentDb = getUserDb(state, urlDatabase);
  if (!urlCheck(req.params.id, currentDb)) {
    res.status(400).send("<h1>URL does not exist</h1>");
  } else if (!state) {
    res.send('<script>alert("Please login to see or add links")</script>');
  } else if (currentDb[req.params.id] === undefined) {
    res.send("<h1>You don't have access to this link or it doesn't exist</h1>");
  } else {
    const templateVars = { id: req.params.id, longURL: currentDb[req.params.id], user: getUserByCookie(state, usersDatabase) };
    res.render("urls_show", templateVars);
  }
});

// Allows to create new user and adds them to the global user database or redirects to urls if already logged in.
app.get("/register", (req, res) => {
  const state = req.session.user_id;
  if (state) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: state };
    res.render("urls_register", templateVars);
  }
});

// Allows to login or redirects to urls if already logged in.
app.get("/login", (req, res) => {
  const state = req.session.user_id;
  if (state) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: state };
    res.render("urls_login", templateVars);
  }
});

// Redirects to longUrl if it exists or sends error msg if it doesn't
app.get("/u/:id", (req, res) => {
  let currentDb = getUserDb(req.session.user_id, urlDatabase);
  const longURL = getUrlbyId(req.params.id, currentDb);
  if (!longURL) {
    res.send("URL does not exist");
  } else {
    res.redirect(longURL);
  }
});

// Posts

// Sends error msg if user already exists or fields are empty. On succesful registration, creates cookie, signs user in and redirects to urls.
app.post("/register", (req, res) => {
  const user_id = generateRandomString();
  if (!req.body.email.trim() || !req.body.password.trim()) {
    res.status(400).send("Please enter an email and password");
  } else if (getUserByEmail(req.body.email, usersDatabase)) {
    res.status(400).send("Account already exists");
  } else {
    req.session.user_id = user_id;
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    usersDatabase[user_id] = { "id": user_id, "email": req.body.email, "password": hashedPassword };
    res.redirect("/urls");
  }
});

// Sends error msg if email is not used, or password is incoorect. On succesful login, creates cookie, signs user in and redirects to urls.
app.post("/login", (req, res) => {
  let verification = verifyUser(req.body.email, req.body.password, usersDatabase);
  if (verification.email === false) {
    res.status(403).send("User does not exist");
  } else if (verification.password === false) {
    res.status(403).send("Password is incorrect");
  } else {
    req.session.user_id = getUserByEmail(req.body.email, usersDatabase).id;
    res.redirect("/urls");
  }
});


// Delets cookie and redirects to login page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Sends error msg if not logged in, otherwise populates page only with links that belong to the user
app.post("/urls", (req, res) => {
  const state = req.session.user_id;
  if (!state) {
    res.send("Please login to create a new URL");
  } else {
    const id = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.session.user_id;
    addLinkToDatabase(id, longURL, userID, urlDatabase);
    res.redirect(`/urls/${id}`);
  }
});

// Allows to delete URL if it belongs to the user or sends error msg if it doesn't exist, user is not logged in or doesn't belong to user.
app.post("/urls/:id/delete", (req, res) => {
  const state = req.session.user_id;
  let currentDb = getUserDb(req.session.user_id, urlDatabase);
  if (!urlCheck(req.params.id, currentDb)) {
    res.send("<h1>URL does not exist</h1>");
  } else if (!state) {
    res.send("<h1>Please login edit or delete links</h1>");
  } else if (currentDb[req.params.id] === undefined) {
    res.send("<h1>You don't have access to this link</h1>");
  } else {
    delete urlDatabase[req.params.id]
    res.redirect("/");
  }
});

// Allows to edit the longUrl without modifying the shortUrl and redirects to URLs
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id]["longURL"] = req.body.longURL;
  res.redirect("/urls");
});


// Port listener

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});