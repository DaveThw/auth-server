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


See the [main README for further details](https://github.com/DaveThw/auth-server#development), and also a [blog post by Andy Gock](https://gock.net/blog/2020/nginx-subrequest-authentication-server/).


If `nginx` isn't installed, install it with:
```
sudo apt install nginx
```

You'll need to make changes to the `nginx` config files (probably in `\etc\nginx\sites-enabled`).  See the [main README for an example](https://github.com/DaveThw/auth-server#example-nginx-conf) - note that in order for the auth process to work everywhere, you need to include (at least) `auth_request /auth;` in each `location` block.  Once the config files are updated, test with:
```
sudo nginx -t
```

Then either start nginx with:
```
sudo service nginx start
```

Or tell it to reload its config if it's already running with:
```
sudo nginx -s reload
```

```
