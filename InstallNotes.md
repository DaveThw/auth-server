# auth-server Install Notes
_(by Dave T, 28th Aug 2023 - installing on a Raspberry Pi 3)_

Download code from github:
```
git clone git@github.com:DaveThw/auth-server.git
cd auth-server
```

If not yet installed, install [`nodemon`](https://nodemon.io/) (globally):
```
sudo npm install -g nodemon
```

If not yet enabled, enable `corepack` ([to enable `yarn`](https://yarnpkg.com/getting-started/install)):
```
corepack enable
```

Install auth-server dependencies:
```
yarn
```

Create your own `.env` file (it doesn't get saved by git, as it's likely to contain sensitive information) - see the [main README for details](https://github.com/DaveThw/auth-server#configure-env) - the contents should look something like this:
```
AUTH_TOKEN_SECRET=<SecretPhraseOrRandomCharacters>
# AUTH_COOKIE_SECURE=false  # defaults to true
AUTH_PASSWORD=<SecretPassword>
```

Start the server:
```
yarn start
```

`yarn` will then watch for changes within the project, and restart `auth-server` if it spots any.


See the [main README for further details](https://github.com/DaveThw/auth-server/tree/install_notes#development), and also a [blog post by Andy Gock](https://gock.net/blog/2020/nginx-subrequest-authentication-server/).
