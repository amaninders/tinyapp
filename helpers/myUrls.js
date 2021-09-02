// returns urls based on the userID

const myUrls = (id, obj) => {
  const urls = {};
  Object.keys(obj).filter(x => obj[x].userID === id).forEach(key => {
    urls[key] = obj[key];
  });
  return urls;
};

module.exports = {
  myUrls
};