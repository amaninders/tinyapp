/*
 * ===================
 * express_server.js
 * ===================
 */

// initialize helpers
const { guid } = require('./helpers/guid');
const { addHttp } = require('./helpers/addHttp');
const { findMyURLs } = require('./helpers/myUrls');
const { userExists } = require('./helpers/findUser');
const { validEmail } = require('./helpers/emailValidator');
const { validPassword } = require('./helpers/passwordValidator');
const { handleError } = require('./helpers/customErrorHandler');

// intialize databases
const { urlDB } = require('./db/urlDb');
const { userDB } = require('./db/userDb');

// app initialization
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

// initialize thirdparty packages
const moment = require('moment');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getLinkPreview } = require('link-preview-js');

// app configuration
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['firstEncryptionKey', 'secondEncryptionKey']
}));
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine','ejs');


/*
 * ===================
 *  	ROUTE METHODS
 * ===================
 */


// route for root of the project
app.get("/", (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  res.redirect('/login');
});


// user login check for routes leading to /urls/*
app.all('/urls/new', function(req, res, next) {
	if (!req.session.user_id) {
		return res.redirect('/login');
	}
	next();
});

// user login check for routes leading to /urls
app.all('/urls', function(req, res, next) {
  if (!req.session.user_id) {
		handleError(res, 'enforceLogin')
  }
  next();
});


// user login check for routes leading to /login*
app.all('/login*', function(req, res, next) {

  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  next();
});

// user login check for routes leading to /register*
app.all('/register*', function(req, res, next) {

  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  next();
});



/*
 * ===================
 *  ROUTE DEFINITIONS
 * ===================
 */


// Register
// render register form
app.get("/register", (req, res) => {
  const templateVars = {
    username: req.session.user_id
  };
  res.render("register", templateVars);
});


// Register
// process register form
app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  if (!validEmail(email)) {
    return handleError(res, 'invalidEmail');
  }
  if (userExists(email, userDB)) {
		return handleError(res, 'existingUser');
  }
  if (!validPassword(password)) {
		return handleError(res, 'passwordRequirements');
  }

  const id = guid(userDB);
	
  userDB[id] = {
    id,
    email,
    password : bcrypt.hashSync(password,10) // we store the hash of password instead of plain text
  };

  req.session['user_id'] = id;
  res.redirect("/urls");
});



// Login
// render login form
app.get("/login", (req, res) => {
  const templateVars = {
    username: req.session.user_id
  };
  res.render("login", templateVars);
});


// Login
// process login form
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = userExists(email,userDB);

  if (!user) {
		return handleError(res, 'noUser');
  }

  bcrypt.compare(password, user.password, function(err) {
    if (err) {
			return handleError(res, 'passwordMatch');
    }
    req.session['user_id'] = user.id;
    res.redirect("/urls");
  });
});


// Logout
// process logout request
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});



// URLS
// render page to add new url
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: userDB[req.session.user_id].email
  };
  res.render("urls_new", templateVars);
});

// URLS
// render all urls on a page
app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  const urls = findMyURLs(user,urlDB);
  const templateVars = {
    urls,
    username: userDB[user].email
  };
  res.render("urls_index", templateVars);
});

// URLS
// process a new url
app.post("/urls", (req, res) => {

  const tinyURL = guid(urlDB);
  const user = req.session.user_id;
  const longURL = req.body.longURL;

  urlDB[tinyURL] = {
    longURL,
    userID: user,
		created_on: moment().format('LLL [UTC]'),
		last_visit: 'NA',
		total_visit: 0,
		unique_visit: {}
  };

  res.redirect(`/urls/${tinyURL}`);

});

// URLS
// render a single url on its own page
app.get("/urls/:id", (req, res) => {

	if (!req.session.user_id) {
		return handleError(res, 'urlsLogin')
  }

  const tinyURL = req.params.id;
  const user = req.session.user_id;
  const urls = findMyURLs(user,urlDB);

  if (tinyURL in urls) {
		const urlItem = urls[tinyURL]; 
		getLinkPreview(urlItem.longURL, {
			imagesPropertyType: "og", // fetches only open-graph images
			headers: {
				"user-agent": "googlebot", // fetches with googlebot crawler user agent
			},
			timeout: 3000,
		}).then(data => {
			const templateVars = {
				shortURL: tinyURL,
				username: userDB[user].email,
				longURL: urlItem.longURL,
				created_on: urlItem.created_on,
				total_visit: urlItem.total_visit,
				unique_visit: urlItem.unique_visit,
			  description: data.description,
			  mediaType: data.mediaType,
			  contentType: data.contentType,
			  images: data.images,
			};
			res.render("urls_show", templateVars);
		})
		.catch(() => {
			const templateVars = {
				shortURL: tinyURL,
				username: userDB[user].email,
				longURL: urlItem.longURL,
				created_on: urlItem.created_on,
				total_visit: urlItem.total_visit,
				unique_visit: urlItem.unique_visit,
			  description: null,
			  mediaType: 'NA',
			  contentType: 'NA',
			  images: null,
			};
			res.render("urls_show", templateVars);
		})
		return;
  }

	return handleError(res, 'unauthorized')
});

// URLS
// delete an existing url
app.post("/urls/:id/delete", (req, res) => {

	if (!req.session.user_id) {
		return handleError(res, 'enforceLogin')
  }

  const tinyURL = req.params.id;
  const user = req.session.user_id;
  const urls = findMyURLs(user,urlDB);

  if (tinyURL in urls) {

    delete urlDB[req.params.id];
    res.redirect(`/urls`);
    return;
  }
	return handleError(res, 'unauthorized')
});

// URLS
// update an existing longURL
app.post("/urls/:id", (req, res) => {

	if (!req.session.user_id) {
		return handleError(res, 'enforceLogin')
  }

  const tinyURL = req.params.id;
  const user = req.session.user_id;
  const urls = findMyURLs(user,urlDB);

  if (tinyURL in urls) {
    urlDB[tinyURL].longURL = req.body.longURL;
    res.redirect(`/urls`);
    return;
  }
	return handleError(res, 'unauthorized')
});

// URLS
// redirect to longURL when someone accesses short url with u/:id
app.get("/u/:shortURL", (req, res) => {
	
	const visitor = (req.session.user_id) ? req.session.user_id : req.ip;
  const tinyURL = req.params.shortURL;

	if (tinyURL in urlDB) {

		const urlItem = urlDB[tinyURL];

		// redirect the visitor to longURL
  	res.redirect(addHttp(urlItem.longURL));

		// update total visit count and last visit
		urlItem.total_visit++;
		urlItem.last_visit = moment().format('LLL [UTC]');

		// update unique visit count
		if (visitor in urlItem.unique_visit) {
			urlItem.unique_visit[visitor].count++;
			return
		}		
	
		urlItem.unique_visit[visitor] = {	count : 1 };
		return;
	}

	return handleError(res, 'deadURL')
});



/*
 * ===================
 *  APP ACTIVATION
 * ===================
 */
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});