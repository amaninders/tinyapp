// initialize helpers
const { validPassword } = require('./helpers/passwordValidator');
const { validEmail } = require('./helpers/emailValidator');
const { userExists } = require('./helpers/findUser');
const { myUrls } = require('./helpers/myUrls');
const { guid } = require('./helpers/guid');

// intialize databases
const { urlDatabase } = require('./db/urlDb');
const { users } = require('./db/userDb');

// express app configuration and initialization
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

// initialize thirdparty packages
const cookieParser = require('cookie-parser');

// middleware configuration
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine','ejs');


app.all('/urls*', function(req, res, next) {
  if (req.cookies["user_id"]) {
    next(); // pass control to the next handler
  }
  res.redirect('/login');
});

/*

	Route definitions

*/


// route for root of the project
app.get("/", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect('/urls');
  }
  res.redirect('/login');
});


// render register page
app.get("/register", (req, res) => {
  if (!req.cookies["user_id"]) {
    const templateVars = {
      username: req.cookies["user_id"]
    };
    return res.render("register", templateVars);
  }
  res.redirect('/urls');
});


// process user registration
app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  if (!validEmail(email)) {
    return res.redirect(401, '/register');
  }

  if (userExists(email, users)) {
    return res.status(409).send('Email is already in use').end();
  }

  if (!validPassword(password)) {
    return res.redirect(40, '/register');
  }

  const id = guid(users);
	
  users[id] = {
    id,
    email,
    password
  };

  console.log(users);
  res.cookie('user_id', id);
  res.redirect("/urls");

});


// render login page
app.get("/login", (req, res) => {
  if (!req.cookies["user_id"]) {
    const templateVars = {
      username: req.cookies["user_id"]
    };
    return res.render("login", templateVars);
  }
  res.redirect('/urls');
});

// process user login
app.post("/login", (req, res) => {
	
  const email = req.body.email;
  const password = req.body.password;
  const user = userExists(email,users);

  if (!user) {
    return res.status(403).send("There's no account with this email address! Please register").end();
  }

  if (user.password !== password) {
    return res.status(403).send("Incorrect email/password combination - please check!").end();
  }

  res.cookie('user_id', user.id);
  res.redirect("/urls");
});

// process user logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

// render page to add new url
app.get("/urls/new", (req, res) => {

  const templateVars = {
    username: users[req.cookies["user_id"]].email
  };

  res.render("urls_new", templateVars);

});

// render all urls index
app.get("/urls", (req, res) => {

  const templateVars = {
    username: users[req.cookies["user_id"]].email,
    urls: myUrls(req.cookies["user_id"],urlDatabase)
  };

  res.render("urls_index", templateVars);

});

// render individual url
app.get("/urls/:shortURL", (req, res) => {

  const templateVars = {
    username: users[req.cookies["user_id"]].email,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };

  res.render("urls_show", templateVars);

});


// delete existing url
app.post("/urls/:id/delete", (req, res) => {

  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);

});

// process short to longURL redirect
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});


// process the newly added URL
app.post("/urls", (req, res) => {

  const tinyURL = guid(urlDatabase);

  urlDatabase[tinyURL] = {
    longurl: req.body.longURL,
    userID: req.cookies["user_id"]
  };

  res.redirect(`/urls/${tinyURL}`);

});

// update existing longURL
app.post("/urls/:id", (req, res) => {

  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);

});


/*
app activation
*/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});