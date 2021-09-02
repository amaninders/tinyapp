// generate a unique ID
const guid = (obj) => {
  const uid = Math.random().toString(36).substring(2, 8);
  if (uid in obj) {
    guid();
  }
  return uid;
};

module.exports = {
  guid
};