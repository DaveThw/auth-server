console.log('Loading auth.js...');

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function loadUsers() {
  const usersString = fs.readFileSync(
    path.join(__dirname, 'users.txt'),
    'utf-8',
  );
  let changed = false;
  const ret = new Map(
    usersString
      .split('\n')
      .filter((line) => line.includes(':') && !line.startsWith('#'))
      .map((line) => {
        let [name, password, ...groups] = line.split(':').map((v) => v.trim());
        if (!password.startsWith('$')) {
          password = bcrypt.hashSync(password);
          changed = true;
        }
        return [name, { hash: password, groups, name }];
      }),
  );
  if (changed) writeUsers(ret);
  return ret;
}

function writeUsers(users) {
  fs.writeFileSync(
    path.join(__dirname, 'users.txt'),
    Array.from(users.values())
      .map((u) => [u.name, u.hash, ...u.groups].join(':'))
      .join('\n') + '\n',
    'utf-8',
  );
}

const users = loadUsers();

// config vars
const bypassToken = process.env.AUTH_BYPASS;

// user = users.get(req.user)

const checkAuth = (username, pass) => {
  console.log('auth.js checkAuth - User:', username, 'Password:', pass);
  const user = users.get(username);
  if (user && bcrypt.compareSync(pass, user.hash)) return true;
  return false;
};

module.exports = checkAuth;
