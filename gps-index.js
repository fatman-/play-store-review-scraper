const gplay = require('google-play-scraper');

gplay
	.app({ appId: 'com.turbo.stars' })
	.then(console.log, console.log);