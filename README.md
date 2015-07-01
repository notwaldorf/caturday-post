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
You need to add a file:

- a `.env` file in the root of your project, that contains your api key and gcm
project id. It should look something like this:

```
GCM_SENDER=[YOUR_PROJECT_ID]
API_KEY=[YOUR_API_KEY]
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
