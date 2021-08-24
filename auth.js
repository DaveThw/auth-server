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

global.users = loadUsers();

// config vars
const bypassToken = process.env.AUTH_BYPASS;

// user = users.get(req.user)

const checkAuth = (username, pass) => {
  console.log('auth.js checkAuth - User:', username, 'Password:', pass);
  const user = users.get(username);
  if (user && bcrypt.compareSync(pass, user.hash)) return true;
  return false;
};

app.get('/manage', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  if (!user.groups.includes('admin')) return res.redirect('/logged-in');

  return res.render('manage', {
    user: user.name || null,
    groups: user.groups,
    users: Array.from(users.values()).map(({ hash, ...rest }) => rest),
  });
});

app.post('/manage', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  if (!user.groups.includes('admin')) return res.redirect('/logged-in');
  if (req.body['action'] === 'delete') {
    const target = users.get(req.body['user']);
    if (target && !target.groups.includes('admin')) {
      users.delete(target.name);
      writeUsers(users);
    }
  } else if (req.body['action'] === 'add') {
    const { username, password } = req.body;
    users.set(username, {
      name: username,
      hash: bcrypt.hashSync(password),
      groups: [],
    });
    writeUsers(users);
  }
  res.redirect('/manage');
});

app.post('/logged-in', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  const { 'old-password': old, password, password2 } = req.body;
  if (!password) {
    return res.redirect('/logged-in?error=empty');
  }
  if (!bcrypt.compareSync(old, user.hash)) {
    return res.redirect('/logged-in?error=wrong');
  }
  if (password !== password2) {
    return res.redirect('/logged-in?error=typo');
  }

  users.set(user.name, { ...user, hash: bcrypt.hashSync(password) });
  writeUsers(users);
  res.redirect('/logged-in?success');
});

module.exports = checkAuth;
