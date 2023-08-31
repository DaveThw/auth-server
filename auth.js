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

// interface for users who are logged in
app.get('/user/', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  return res.render('user', {
    user: user.name || null,
    groups: user.groups,
  });
});

// interface for users who are logged in
app.get('/user/password', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  const result = req.query['result'];
  console.log('get /user/password - result: ', result);
  return res.render('password', {
    user: user.name || null,
    message:
      result === 'empty'
        ? 'New password must not be empty'
        : result === 'wrong'
        ? 'Old password is incorrect'
        : result === 'typo'
        ? 'New passwords are not the same'
        : result === 'success'
        ? 'Password was changed successfully'
        : result === undefined
        ? null
        : 'Unrecognised result!',
  });
});

app.post('/user/password', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  console.log('post /user/password -', req.body);
  const form = req.get('content-type') === 'application/x-www-form-urlencoded';
  const { 'old-password': old, password, password2 } = req.body;
  result = 'success';
  if (!password) {
    result = 'empty';
  } else if (!bcrypt.compareSync(old, user.hash)) {
    result = 'wrong';
  } else if (password !== password2) {
    result = 'typo';
  } else {
    result = 'success';
  }

  if (result === 'success') {
    users.set(user.name, { ...user, hash: bcrypt.hashSync(password) });
    writeUsers(users);
  }

  if (form) {
    return res.redirect('/user/password?result=' + result);
  } else {
    return res.send({ status: result });
  }
});

app.get('/user/manage', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  if (!user.groups.includes('admin')) return res.redirect('/user/');

  return res.render('manage', {
    user: user.name || null,
    groups: user.groups,
    users: Array.from(users.values()).map(({ hash, ...rest }) => rest),
  });
});

app.post('/user/manage', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const user = users.get(req.user);
  if (!user) return res.redirect('/login');
  if (!user.groups.includes('admin')) return res.redirect('/user/');
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
  res.redirect('/user/manage');
});

module.exports = checkAuth;
