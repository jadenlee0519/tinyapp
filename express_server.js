const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser')
app.use(cookieParser())
// EJS template
app.set("view engine", "ejs");
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
function generateRandomString() {
  let randomStr = Math.random().toString(36).substring(6);
  if (randomStr.length !== 6) {
    randomStr = generateRandomString();
  }
  return randomStr;
}
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
// ROUTING
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
  res.redirect(longURL);
  } else {
    res.status(404);
  }
});
// Allows us to render a new website URL and displays it with the urls_new template
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  }
  res.render("urls_new", templateVars);
});
// delete url
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect('/urls')
})
// edit request
app.post('/urls/:id/', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL
  res.redirect('/urls')
})
// login functionality
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username)
  res.redirect('/urls')
})
// Generates short URL that is added to database and redirected to urls/:id
app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL;
  res.redirect(`urls/${newId}`); 
});

// logout endpoint
  app.post('/logout', (req, res) => {
    res.clearCookie('username')
    res.redirect('/urls')
  })

// Displays short URL and long URL
app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    username: req.cookies["username"] 
  };
  res.render("urls_show", templateVars);
});

// Displays our urls in the urlDatabase by using urls_index template
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});
app.get("/", (req, res) => {
  res.send("Hello!");
});