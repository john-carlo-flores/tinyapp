const generateRandomString = (stringLength) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = upper.toLocaleLowerCase();
  const digits = "0123456789";
  const alphanumeric = upper + lower + digits;
  let randomString = '';

  for (let i = 0; i < stringLength; i++) {
    randomString += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  
  return randomString;
};

const getUserByKeyValue = (key, value, database) => {
  for (const userID in database) {
    if (database[userID][key] === value) {
      return database[userID];
    }
  }
};

const urlsForUser = (id, database) => {
  const newData = {};

  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      newData[shortURL] = database[shortURL].longURL;
    }
  }

  return newData;
};

module.exports = {
  generateRandomString,
  getUserByKeyValue,
  urlsForUser
};