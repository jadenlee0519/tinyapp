const bcrypt = require("bcryptjs");  // used to hash passwords
const salt = bcrypt.genSaltSync(10);

// returns an object that contains only the links that belong to the user in the global urlDatabase
const getUserDb = (cookie, db) => {
  let currentDb = {};
  let currentUser = cookie;
  for (const urls in db) {
    if (db[urls].userID === currentUser) {
      let key = urls;
      let value = db[urls]["longURL"];
      currentDb[key] = value;
    }
  }
  return currentDb; 
};

// generates ID used for new users and links
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// adds link to global urlDatabase
const addLinkToDatabase = (id, url, user_id, db) => {
  db[id] = { "longURL": url, "userID": user_id };
};

// verifies if url exists in global urlDatabase
const urlCheck = (urlID, db) => {
  for (const id in db) {
    if (id === urlID) {
      return true;
    }
  }
  return false;
};

// returns an object with 2 boolean values representing if the email inputted is valid and if the password inputted is valid
const verifyUser = (email, password, db) => {
  let verification = { "email": false, "password": false };
  for (let users in db) {
    if (db[users].email === email) {
      verification.email = true;
      if (bcrypt.compareSync(password, db[users].password)) {
        verification.password = true;
      }
    }
  }
  return verification;
};

// gets the user in userdatabase from cookie
const getUserByCookie = (cookie, db) => {
  for (let user in db) {
    if (db[user].id === cookie) {
      return db[user];
    }
  }
  return undefined;
};

//  gets the user in userdatabase from email
const getUserByEmail = (email, db) => {
  for (let user in db) {
    if (db[user].email === email) {
      return db[user];
    }
  }
  return undefined;
};

// gets URL from the url id
const getUrlbyId = (id, db) => {
  if (Object.keys(db).includes(id)) {
    return db[id];
  }
  return undefined;
};


module.exports = { getUserDb, generateRandomString, addLinkToDatabase, urlCheck, verifyUser, getUserByCookie, getUserByEmail, getUrlbyId };