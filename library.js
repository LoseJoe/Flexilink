const Discord = require('discord.js')
const ytsearch = require('yt-search')
const { Shoukaku } = require('shoukaku')
const ytdl = require('ytdl-core')

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

class LastValue {
	constructor() {
		this.object = {}
	}
	getLast(newValue, identifier) {
		if(!this.object[identifier]) this.object[identifier] = []
		this.value = this.object[identifier][this.object[identifierl].length - 1]
		this.object[identifier].push(newValue)
    if(this.object[identifier].length > 2) this.object[identifier].shift()
    if(!this.value) return undefined
		return this.value
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

	getStats() {
		return this.shoukakuNode.stats
	}

	async join(voiceChannel, options) {
		this._checkCache(voiceChannel.guild.id)
		const serverCache = this.cache.get(voiceChannel.guild.id)

		if (!voiceChannel) return console.log("Specify Option 'Channel' In Join Options.");
		if (!voiceChannel.guild) return console.log("Couldn't Find Guild In 'channel'.'")
		if(!options) options = {deaf:true, mute:false}

		options.guildID = voiceChannel.guild.id
		options.voiceChannelID = voiceChannel.id

		serverCache.options = options


		return new Promise(async (res, rej) => {
			if(serverCache.connection_type == "lavalink") {
				console.log("joining with lavalink")
				serverCache.player = await this.shoukakuNode.joinVoiceChannel(options)
				res(serverCache.player)
			}

			if(serverCache.connection_type == "ytdl") {
				console.log("joining with ytdl")
				serverCache.connection = await voiceChannel.join()
				res(serverCache.connection)
			}
		})

	}

	async leave(voiceChannel) {
		this._checkCache(voiceChannel.guild.id)		
		var serverCache = this.cache.get(voiceChannel.guild.id)

		if(serverCache.connection_type == "lavalink") {
			var result = await serverCache.player.disconnect()
			serverCache.player = null;
		}

		if(serverCache.connection_type == "ytdl") {
			var result = await voiceChannel.leave()
			serverCache.connection = null;
		}

	}

	async play(song, voiceChannel) {
		this._checkCache(voiceChannel.guild.id)

		var serverCache = this.cache.get(voiceChannel.guild.id)

		if (!song.track) {
			var songData = await this.shoukakuNode.rest.resolve(song.url);
			song = songData
		}

		if(song.info.isStream) {
			await this._switchToLive(voiceChannel)
		} else {
			await this._switchToTrack(voiceChannel)
		}

		console.log(serverCache.connection_type)

		if(serverCache.connection_type == "lavalink") {
			if(serverCache.player) {
				serverCache.player.playTrack(song.track)
				serverCache.player.type = "track"
				return serverCache.player
			}
		}

		if(serverCache.connection_type == "ytdl") {
			if(serverCache.connection) {
				serverCache.player = await ytdl(song.info.uri, {quality: 'highestaudio', highWaterMark:600000, volume: 0.1})
				serverCache.dispatcher = await serverCache.connection.play(serverCache.player)
				serverCache.dispatcher.setVolume(0.1)
				serverCache.player.type = "livestream"
				return serverCache.player
			}
		}

	}

	getCache(guildid) {
		this._checkCache(guildid)
		return this.cache.get(guildid)
	}

	_switchToLive(voiceChannel) {
		return new Promise(async (res, rej) => {
			this._checkCache(voiceChannel.guild.id)
			var serverCache = this.cache.get(voiceChannel.guild.id)

			if(serverCache.connection_type == "ytdl") return res(undefined)

			console.log("Disconnecting Lavalink.")
			await serverCache.player.disconnect()
			serverCache.player = null;

			console.log("connecting on discord.js")

			setTimeout(async () => {
				serverCache.connection = await voiceChannel.join()

				serverCache.connection_type = "ytdl"
				res(serverCache.connection_type)
			}, 1000)
		})
	}

	_switchToTrack(voiceChannel) {
		return new Promise(async (res, rej) => {
			this._checkCache(voiceChannel.guild.id)
			var serverCache = this.cache.get(voiceChannel.guild.id)

			if(serverCache.connection_type == "lavalink") return res(undefined)
			console.log("disconnecting on discord.js")

			await voiceChannel.leave()
			console.log("connecting on lavalink")

			setTimeout(async () => {

				var options = serverCache.options
				options.guildID = voiceChannel.guild.id
				options.voiceChannelID = voiceChannel.id

				serverCache.player = await this.shoukakuNode.joinVoiceChannel(options)
				serverCache.connection = null;
				serverCache.connection_type = "lavalink"

				res(serverCache.connection_type)
			}, 1000)
		})

	}

	_checkCache(guild) {
		if (!this.cache.has(guild)) this.cache.set(guild, {
			connection: null,
			player: null,
			connection_type: "lavalink",
			isLive: false
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
