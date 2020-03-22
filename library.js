const { Manager } = require('lavacord')
const Discord = require('discord.js')
const ytsearch = require('yt-search')
const { Shoukaku } = require('shoukaku')

class Flexilink {
	constructor(options) {
		if (!options) return console.log("Please Specify PlayerManager Options.")
		if (!options.client) return console.log("'client' Is Not Defined In PlayerManager Options.")
		if (!options.nodes) return console.log("'nodes' Is Not Defined In PlayerManager Options.")

		this.shoukakuOptions = options.shoukakuOptions || {
			moveOnDisconnect: false,
			resumable: false,
			resumableTimeout: 30,
			reconnectTries: 2,
			restTimeout: 10000
		}
		this.client = options.client;
		this.nodesArray = options.nodes;
		this.nodes = new Discord.Collection()

		this.manager = new Shoukaku(this.client, this.nodesArray, this.shoukakuOptions)

		this.manager.on('ready', (name) => {
			console.log(`Lavalink Node: ${name} is now connected`)

			this.nodesArray.map(nodeInfo => {
				nodeInfo.manager = this.manager
				if (!node.name) return console.log("A Node Doesn't Have A Name!")
				this.nodes.set(node.name, new node(nodeInfo))
			})
		});
		// You must handle error event
		this.manager.on('error', (name, error) => console.log(`Lavalink Node: ${name} emitted an error.`, error));
		this.manager.on('close', (name, code, reason) => console.log(`Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || 'No reason'}`));
		this.manager.on('disconnected', (name, reason) => console.log(`Lavalink Node: ${name} disconnected. Reason: ${reason || 'No reason'}`));

		this.client.on("ready", () => {

			console.log("Flexilink Loaded.")

		})
	}
}

class node {
	constructor(info) {
		if (!info) return console.log("Please Specify Node Options.")
		if (!info.name) return console.log("One Or More Of The Nodes Dont Have A Name!")
		if (!info.host) return console.log(`${info.name} Doesn't Have A Host!`)
		if (!info.port) return console.log(`${info.name} Doesn't Have A Port!`)
		if (!info.auth) return console.log(`${info.name} Doesn't Have An Auth!`)
		if (!info.manager) return console.log(`Couldn't find manager for ${info.name}`)
		this.node = info
		this.shoukakuNode = this.node.manager.getNode(this.node.name)
		this.cache = new Discord.Collection()
		console.log(this.node)
	}

	loadTracks(query, type) {
		if (!query) return console.log("Specify Query 1rst Argument On loadTracks()")
		if (!type) return console.log("Specify Type 2nd Argument On loadTracks() Types: yt, sc")
		if (type == "yt") {
			return new Promise(async(res, rej) => {
				const ytsr = (url) => new Promise((resolve, reject) => ytsearch(url, (err, r) => err ? reject(err) : resolve(r)));
				var data = await ytsr(query);
				if (!data) return res(undefined);
				res(parseInfo(data));
			})
		}

		if (type == "sc") {
			return new Promise(async(res, rej) => {
				const search = await this.shoukakuNode.rest.resolve(`${query}`, "soundcloud");
				if (!search) return res(undefined);
				res(parseInfo(search));
			})
		}


	}

	async join(channel, options) {
		if (!channel) return console.log("Specify Option 'Channel' In Join Options.");
		if (!channel.guild) return console.log("Couldn't Find Guild In 'channel'.'")
		if(!options) options = {}

		options.guildID = channel.guild.id
		options.voiceChannelID = channel.id

		this._checkCache(channel.guild.id); // guild id
		var serverCache = this.cache.get(channel.guild.id);

		serverCache.player = await this.shoukakuNode.joinVoiceChannel(options);

		return serverCache.player;

	}

	async leave(guild) {
		if (!guild) return console.log("Specify Option 'Guild', In Leave Options.");
		if (!guild.id) return console.log("Couldn't Find ID In 'guild'.");

		this._checkCache(guild.id);
		var serverCache = this.cache.get(guild.id);

		var result = serverCache.player.disconnect()
		serverCache.player = null;

		return result

	}

	async play(song, guild) {

		this._checkCache(guild.id);
		var serverCache = this.cache.get(guild.id);

		if (!song.track) {
			var songData = await this.shoukakuNode.rest.resolve(song.url);
			song = songData
		}

		if(song.info.isStream) {
			console.log("Currently doesn't support livestreams. But will try anyway. (FIXING SOON)")
		}

		if (!song.track) return console.log("Specify Option 'track', In Play Options.")


		serverCache.player.playTrack(song.track)
		return serverCache.player
	}

	_checkCache(guild) {
		if (!this.cache.has(guild)) this.cache.set(guild, {
			connection: null,
			player: null
		})
	}


}


function parseInfo(info) {

	return new Promise((res, rej) => {
		var parsedInfo = {
			tracks: [],
			playlists: [],
			channels: []
		}

		if (info.videos) { //Parsing Youtube Videos (from yt-search)
			if (info.videos.length) {
				console.log(`Parsing ${info.videos.length} Videos.`)
				info.videos.map(video => {
					parsedInfo.tracks.push({
						type: video.type,
						track: undefined,
						title: video.title,
						url: video.url,
						length: video.seconds * 1000,
						isStream: video.seconds == 0 ? true : false,
						author: {
							name: video.author.name
						}
					})
				})
			}

			if (info.playlists.length) {
				console.log(`Parsing ${info.playlists.length} playlists.`)
				info.playlists.map(playlist => {
					parsedInfo.playlists.push(playlist)
				})
			}

			if (info.channels.length) {
				console.log(`Parsing ${info.playlists.length} channels.`)
				info.channels.map(channel => {
					parsedInfo.channels.push(channel)
				})
			}

		}

		if (info.tracks) { //Parsing Lavalink Videos
			if (!Array.isArray(info.tracks)) return;
			console.log(`Parsing ${info.tracks.length} Lavalink Videos`)
			info.tracks.map(video => {
				if (!video.track) return;
				parsedInfo.tracks.push({
					type: "lavalink_track",
					track: video.track,
					title: video.info.title,
					url: video.info.uri,
					length: video.length,
					isStream: video.isStream,
					author: {
						name: video.info.author
					}
				})
			})
		}

		res(parsedInfo)
	})
}


module.exports = Flexilink;
