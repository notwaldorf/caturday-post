# push-cat-ifications
Push notifications with cats


# Configure it
You need to add two files:

- a `config.js` file in the root of your project, that contains your api key. It
should look something like this:

```
module.exports = {'apiKey': 'YOUR_SUPER_SECRET_API_KEY'};
```
- a `manifest.json` file in the `public` directory, that contains your GCM
project id. It should look something like this:

```
{
	"gcm_sender_id": "YOUR_GCM_PROJECT_NUMBER",
	"gcm_user_visible_only": true
}

```

# Install it
This uses `npm` for the node server bits, and `bower` for the client side
polymer bits (in particular `platinum-push-messaging`, without which I would
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

In your browser, open two tabs:

- a [page](http://localhost:3000/index.html) that lets you send notifications to all the clients. It should tell you how many clients are registered.
- a [page](http://localhost:3000/registration.html) that lets the browser register for push notifications. You will have to enable push notifications for
this to work.

Then watch the cats roll in.
