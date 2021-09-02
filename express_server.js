// initialize constants for the server
const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

// middleware configuration
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine','ejs');


/*
	app databases
*/

// url database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


// users database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
	}
}


/* 
	app functions
*/

// generate a unique ID
const generateRandomString = (obj) => {
  const uid = Math.random().toString(36).substring(2, 8);
	console.log(uid);
	if (uid in obj) {
		generateRandomString();
	}
	return uid;
};

const userExists = (emailAddr, db) => {
		for (let userId in db) {
			if (db[userId].email === emailAddr) {
				return db[userId]; // return the user object
			}
		}
		return false;
	};

/* 
	Route definitions 
*/


// register page
app.get("/register", (req, res) => {
	const templateVars = { 
		username: req.cookies["username"],
	};
  res.render("register", templateVars);
});

// add new user
app.post("/register", (req, res) => {

	const id = generateRandomString(users);
	const email = req.body.email;
	const password = req.body.password;

	if (!userExists(email, users)) {
		users[id] = {
			id,
			email,
			password
		}

		console.log(users);
		res.cookie('user_id', id);
  	res.redirect("/urls");		
	}

});

// short to longURL redirect
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// index page with all urls
app.get("/urls", (req, res) => {
  const templateVars = { 
		username: req.cookies["username"],
		urls: urlDatabase 
	};
  res.render("urls_index", templateVars);
});

// new url page
app.get("/urls/new", (req, res) => {
	const templateVars = { 
		username: req.cookies["username"],
	};
  res.render("urls_new", templateVars);
});

// short url page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
		username: req.cookies["username"],
		shortURL: req.params.shortURL, 
		longURL: urlDatabase[req.params.shortURL] 
	};
  res.render("urls_show", templateVars);
});

// login
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(`/urls`);
});

// logout
app.post("/logout", (req, res) => {
  res.clearCookie('username')
  res.redirect(`/urls`);
});

// create a new short url
app.post("/urls", (req, res) => {
  const tinyURL = generateRandomString(urlDatabase);
  urlDatabase[tinyURL] = req.body.longURL;
  res.redirect(`/urls/${tinyURL}`);
});

// update longURL 
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

// delete url key:value
app.post("/urls/:id/delete", (req, res) => {
  // delete given property/url from the object
	delete urlDatabase[req.params.id];
	res.redirect(`/urls`)
});



/* 
	app activation
*/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});