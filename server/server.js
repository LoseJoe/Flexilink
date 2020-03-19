
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const ytsearch = require('yt-search')
const ytdl = require('ytdl-core')
const buffer = 2000

class Server {

	constructor(config) {

		if(!config) config = {}
		if(!config.port) return console.log("Must Specify Port In Server Options.");
		if(!config.host) return console.log("Must Specify Host In Server Options.");
		if(!config.password) return console.log("Must Specify Password In Server Options.");

		this.app = express()
		this.app.listen(config.port, config.host, () => {
			console.log(`Web Server Ready On Port ${config.port}`)
		});

		this.app.use(express.static('./songs'));
      
		this.app.use(bodyParser.urlencoded({
    		extended: true
		}));

		this.password = config.password
		this.host = config.host
		this.password = config.password

		this.app.get("/loadtracks", async (req, res) => {
			if(req.headers.authorization == this.password) {
				console.log(`Authorized. Loading Tracks For: ${req.query.identifier}`)
				var data = await search(req.query.identifier)
				res.send(data)
			} else {
				res.send("UNAUTHORIZED")
			}
		});

		this.app.post("/download", async (req, res) => {
			if(req.headers.authorization == this.password) {
				console.log(`Downloading: ${this.host}`)
				var id = req.headers.id

				if(fs.existsSync(`./songs/${id}.mp4`)) {
					console.log("File exists, sending.")
					res.set('Content-Type', 'text/plain')
					if(req.headers.type == "over_internet") return res.send(`http://${req.headers.httppath}/${id}.mp4`)
					if(req.headers.type == "server_only") return res.send(`${__dirname}/songs/${id}.mp4`)
				}

				ytdl(`https://www.youtube.com/watch?v=${id}`, {highWaterMark:600000}).pipe(fs.createWriteStream(`./songs/${id}.mp4`))
				setTimeout(() => {
					res.set('Content-Type', 'text/plain')
					if(req.headers.type == "over_internet") return res.send(`http://${req.headers.httppath}/${id}.mp4`)
					if(req.headers.type == "server_only") return res.send(`${__dirname}/songs/${id}.mp4`)
				}, buffer)
			} else {
				res.send("UNAUTHORIZED")
			}
		});

	}

}

async function search(song) {

	return new Promise(async (resolve, reject) => {

		const ytsr = (url) => new Promise((resolve, reject) => ytsearch(url, (err, r) => err ? reject(err) : resolve(r)));
	    var data = await ytsr(song);

	    if(data) { 
	    	resolve(data)
	    } else {
	    	resolve(undefined)
	    }

	})

}

module.exports = Server















new Server({port:69, host:"localhost", password:"youshallnotpass"})