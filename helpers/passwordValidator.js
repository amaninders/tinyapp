// validate password
const validPassword = input => {
  const pwRegex =  /^[A-Za-z]\w{6,20}$/;
  return (input !== undefined && pwRegex.test(input) ? true : false);
};

module.exports = {
  validPassword,
};