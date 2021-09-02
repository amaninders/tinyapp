// returns user object if it exists
const userExists = (emailAddr, db) => {
  for (let userId in db) {
    if (db[userId].email === emailAddr) {
      return db[userId]; // return the user object
    }
  }
  return false;
};


module.exports = {
	userExists
}