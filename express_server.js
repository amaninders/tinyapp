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



/*

Route definitions

*/

// user login check for routes leading to /url*
app.all('/urls*', function(req, res, next) {
  if (!req.cookies["user_id"]) {
  	return res.redirect('/login');
  }
	next(); // pass control to the next handler
});

// user login check for routes leading to /login*
app.all('/login*', function(req, res, next) {

  if (req.cookies["user_id"]) {
		res.redirect('/urls')
  }
	next(); // pass control to the next handler  
});

// user login check for routes leading to /register*
app.all('/register*', function(req, res, next) {

  if (req.cookies["user_id"]) {
		res.redirect('/urls')
  }
	next(); // pass control to the next handler  
});

// route for root of the project
app.get("/", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect('/urls');
  }
  res.redirect('/login');
});


// render register page
app.get("/register", (req, res) => {
  
	const templateVars = {
    username: req.cookies["user_id"]
  };
		
	res.render("register", templateVars);
	
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
    return res.redirect(401, '/register');
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

  const templateVars = {
    username: req.cookies["user_id"]
  };

	res.render("login", templateVars);

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

	const user = req.cookies["user_id"];
	const urls = myUrls(user,urlDatabase);
  const templateVars = {
		urls,
    username: users[user].email
  };

  res.render("urls_index", templateVars);

});


// process the newly added URL
app.post("/urls", (req, res) => {

  const tinyURL = guid(urlDatabase);
	const user = req.cookies["user_id"];

  urlDatabase[tinyURL] = {
    longurl: req.body.longURL,
    userID: user
  };

  res.redirect(`/urls/${tinyURL}`);

});


// render individual url
app.get("/urls/:id", (req, res) => {

	const shortURL = req.params.id
	const user = req.cookies["user_id"]
	const urls = myUrls(user,urlDatabase);

	if (shortURL in urls) {
		const templateVars = {
			shortURL,
			username: users[user].email,
			longURL: urls[shortURL].longURL
		};
	
		return res.render("urls_show", templateVars);	

	}

	res.redirect('/error'); // to be implemented

});

// delete existing url
app.post("/urls/:id/delete", (req, res) => {

	const shortURL = req.params.id
	const user = req.cookies["user_id"]
	const urls = myUrls(user,urlDatabase);

	if (shortURL in urls) {
		const templateVars = {
			shortURL,
			username: users[user].email,
			longURL: urls[shortURL].longURL
		};
	delete urlDatabase[req.params.id];
  
	res.redirect(`/urls`);
	}

	res.redirect('/error') // to be implemented

});

// update existing longURL
app.post("/urls/:id", (req, res) => {

	const shortURL = req.params.id
	const user = req.cookies["user_id"]
	const urls = myUrls(user,urlDatabase);

	if (shortURL in urls) {
		const templateVars = {
			shortURL,
			username: users[user].email,
			longURL: urls[shortURL].longURL
		};

	  urlDatabase[req.params.id] = req.body.longURL;
	  res.redirect(`/urls`);
	}

	res.redirect('/error')

});

// process short to longURL redirect
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

/*
app activation
*/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});