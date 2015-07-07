# caturday-post
Send 🐱to browsers around the world using push notifications. Behind the scenes
it uses a Polymer `platinum-push-messaging` element that registers a browser for
push notifications, and a `node` server that collects all the registered clients
and sends them cats.

# Play with it
In the wild, this lives on a heroku free dyno, so it gets restarted often and
drops all of the registered browsers. Not sure that's such a bad thing. You can:
- [register](https://caturday-post.herokuapp.com/) your browser to use push
notifications, and receive cats when they are sent out
- [send cats](https://caturday-post.herokuapp.com/meow.html) to all the
registered clients. The server will only send one cat a minute, because I
don't trust all y'all internet people to not spam me.

🎉😻🎉

# Configure it
There are three items that need to be configured. The ID of your Google
Developer Console project, the corresponding API key, and the URL of your
MongoDB database.

To find the first two, enable the API through the [getting started flow][1].
Ignore that it says it is setting up an Android project, and ensure that you
enable Google Cloud Messaging.

You can either set up your own MongoDB server, or add one to your heroku app
with:

`heroku addons:create mongolab`

You can then see the URL of your instance with

`heroku config`.

Now you need to add a file:

- a `.env` file in the root of your project, that contains your config values.
This sets the config that should be used by the Heroku `foreman` tool. It should
look something like this:

```
GCM_SENDER=[YOUR_PROJECT_ID]
API_KEY=[YOUR_API_KEY]
MONGOLAB_URI=[YOUR_MONGODB_URL]
```

If you want to publicly deploy your app to Heroku you will also need to set the
config values on your live app:

```
heroku config:set GCM_SENDER=[YOUR_PROJECT_ID] API_KEY=[YOUR_API_KEY]
```

# Install it
This uses `npm` for the node server bits, and `bower` for the client side
Polymer bits (in particular `platinum-push-messaging`, without which I would
have had to slave for days over service worker code. 💖)

```
npm install
bower install
```

# Run it
You start the server with

```
node server.js
```

This code is also heroku ready, so you can also start it with
```
foreman start
```

In your browser, open two tabs:

- [index.html](http://localhost:3000/index.html), which lets the browser register for push notifications.
You will have to enable push notifications for this to work.
- [meow.html](http://localhost:3000/registration.html) which sends the notifications
(let's be honest: the cats) to all the registered clients. It should also tell you how many clients are registered.


Then watch the 🐱 roll in.

[1]: https://developers.google.com/mobile/add?platform=android&cntapi=gcm&cntpkg=com.example&cntapp=Caturday%20Post
