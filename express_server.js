// initialize modules and constants
const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
// set view engine to ejs
app.set('view engine','ejs');


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  Math.random().toString(36).substring(2, 8);
};

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
		username: req.cookies["username"],
		urls: urlDatabase 
	};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
		username: req.cookies["username"],
		shortURL: req.params.shortURL, 
		longURL: urlDatabase[req.params.shortURL] 
	};
  res.render("urls_show", templateVars);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(`/urls`);
});

app.post("/urls", (req, res) => {
  const tinyURL = generateRandomString();
  urlDatabase[tinyURL] = req.body.longURL;
  res.redirect(`/urls/${tinyURL}`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});


app.post("/urls/:id/delete", (req, res) => {
  // delete given property/url from the object
	delete urlDatabase[req.params.id];
	res.redirect(`/urls`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});