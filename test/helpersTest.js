const { assert } = require('chai');
const { userExists } = require('../helpers/findUser');

const testUsers = {
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
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = userExists("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
		assert.strictEqual(user.id, expectedOutput)
  });
	
	it('should return undefined if the email does not exist in the database', function() {
    const user = userExists("nouser@example.com", testUsers)
    const expectedOutput = undefined;
		assert.strictEqual(user.id, expectedOutput)
  });
});