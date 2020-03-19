const Discord = require('discord.js')
const request = require('node-superfetch')
const ytdl = require('ytdl-core') //Only used for streams

class PlayerManager {
	constructor(options) {
		if(!options) return console.log("Please Specify PlayerManager Options.")
		if(!options.client) return console.log("'client' Is Not Defined In PlayerManager Options.")
		if(!options.nodes) return console.log("'nodes' Is Not Defined In PlayerManager Options.")

		this.nodes = this._loadNodes(options.nodes)
		this.client = options.client
		this.client.on("ready", () => {
			this.id = this.client.user.id
			console.log("Discord Bot Loaded.")
		})

		this.cache = new Discord.Collection()

	}

	_loadNodes(nodes) {
		var temp_nodes = []
		nodes.map(node => {
			temp_nodes.push(new instance(node))
		})
		return temp_nodes
	}





}


class instance {

	constructor(options) {
		if(!options) return console.log("Please Specify Node Options.")
		if(!options.name) return console.log("One Or More Of The Nodes Dont Have A Name!")
		if(!options.host) return console.log(`${options.name} Doesn't Have A Host!`)
		if(!options.port) return console.log(`${options.name} Doesn't Have A Port!`)
		if(!options.password) return console.log(`${options.name} Doesn't Have A Password!`)
		this.node = options
	}

	async loadTracks(query) {

    	const params = new URLSearchParams();
    	params.append("identifier", query);

    	let result;
    	try {
        	result = await request.get(`http://${this.node.host}:${this.node.port}/loadtracks?${params.toString()}`)
            	.set('Authorization', this.node.password);
        	} catch (e) {
            	return e.message;
        	};
    	return result.body;

	}

	async joinVoiceChannel(voiceChannel) {

		this._checkCache(voiceChannel.guild)

		var serverCache = this.cache.get(voiceChannel.guild.id)
		serverCache.connection = await voiceChannel.join()

		return serverCache.connection
	}

	play(track, guild, type) {
		this._checkCache(guild)
		return new Promise(async (res, rej) => {

			this._checkCache(guild)

			var serverCache = this.cache.get(guild.id)

			if(track.seconds == 0) {
				await serverCache.connection.play(ytdl(track.url, {highWaterMark:600000}))
				return res(serverCache.connection.dispatcher)
			}

			var result = await request.post(`http://${this.node.host}:${this.node.port}/download`)
            	.set('Authorization', this.node.password)
            	.set('id', track.videoId)
            	.set('type', type)
            	.set('httppath', `${this.node.host}:${this.node.port}`)

        


			console.log(`Playing: ${result.body.toString('utf8')}`)

			await serverCache.connection.play(result.body.toString('utf8'))

			res(serverCache.connection.dispatcher)

		})

	}

	async leaveVoiceChannel(guild) {
		this._checkCache(guild)
		var serverCache = this.cache.get(guild.id)
		return serverCache.connection.channel.leave()
	}

	getConnection(guild) {
		this._checkCache(guild)
		var serverCache = this.cache.get(guild.id)
		return serverCache.connection
	}

	_checkCache(guild) {
		if(!this.cache) this.cache = new Discord.Collection()
		if(!this.cache.has(guild.id)) this.cache.set(guild.id, {
			connection: null
		})
	}

}

module.exports = PlayerManager