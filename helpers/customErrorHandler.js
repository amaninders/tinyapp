const handleError = (res, action) => {

	const errorMap = {
		'invalidEmail': {
			code: 401,
			msg: 'The email you provided was invalid',
			returnTo: '/register'
		},
		'existingUser': {
			code: 409,
			msg: 'Someone on some planet is already using this email address',
			returnTo: '/register'
		},
		'passwordRequirements': {
			code: 401,
			msg: 'We need a stronger password like gravity (6 characters or more..)',
			returnTo: '/register'
		},
		'enforceLogin': {
			code: 401,
			msg: 'Please sign in for a home run',
			returnTo: '/login'
		},
		'noUser': {
			code: 403,
			msg: 'There is no account with this email address! Please register',
			returnTo: '/register'
		},
		'passwordMatch': {
			code: 403,
			msg: 'Invalid credentials can make your head spin',
			returnTo: '/login'
		},
		'urlsLogin': {
			code: 401,
			msg: 'You need to be signed in to access urls',
			returnTo: '/login'
		},
		'deadURL': {
			code: 404,
			msg: 'This url does not exist in our universe',
			returnTo: '/'
		},
		'unauthorized': {
			code: 401,
			msg: 'Seems like you do not have access to this url or your spaceship',
			returnTo: '/'
		},
	};

	const item = errorMap[action];
	res.status(item.code);
  res.render('error', { error: item.code, msg: item.msg, returnTo: item.returnTo});
  return;		
}

module.exports = {
	handleError
}