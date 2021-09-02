// validate password
const validPassword = input => {
  const pwRegex =  /^[A-Za-z]\w{0,20}$/;
  return (input !== undefined && input.match(pwRegex) ? true : false);
};

module.exports = {
	validPassword,
}