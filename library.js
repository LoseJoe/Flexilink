const Discord = require('discord.js');
const request = require('node-superfetch');
const ytdl = require('ytdl-core');
const ytsearch = require("yt-search");
const ytpl = require("ytpl");
const lavalink = require('discord.js-lavalink')

class PlayerManager {
	constructor(options) {
		if(!options) return console.log("Please Specify PlayerManager Options.")
		if(!options.client) return console.log("'client' Is Not Defined In PlayerManager Options.")
		if(!options.nodes) return console.log("'nodes' Is Not Defined In PlayerManager Options.")

		this.nodes = this._loadNodes(options.nodes)
		this.client = options.client
		this.client.on("ready", () => {
			this.id = this.client.user.id
			this.ll = lavalink
			this.LavaManager = lavalink.PlayerManager
			this.pm = new this.LavaManager(this.client, options.nodes, {
        		user: this.client.user.id,
        		shards: this.client.shard ? this.client.shard.count : 0
   			});
			console.log("Discord Bot Loaded.")
		})

	}

	_loadNodes(nodes) {
		var temp_nodes = []
		nodes.map(node => {
			temp_nodes.push(new instance(node, this))
		})
		return temp_nodes
	}
	
}


class instance {
	constructor(options, PlayerManager) {
		if(!options) return console.log("Please Specify Node Options.")
		if(!options.name) return console.log("One Or More Of The Nodes Dont Have A Name!")
		if(!options.host) return console.log(`${options.name} Doesn't Have A Host!`)
		if(!options.port) return console.log(`${options.name} Doesn't Have A Port!`)
		if(!options.password) return console.log(`${options.name} Doesn't Have A Password!`)
		this.node = options
		this.PlayerManager = PlayerManager
	}

	loadTracks(query, type) {
		if(!query) return console.log("Specify Query 1rst Argument On loadTracks()")
		if(!type) return console.log("Specify Type 2nd Argument On loadTracks() Types: yt, sc")
		if(type == "yt") {
			return new Promise(async (res, rej) => {
				const ytsr = (url) => new Promise((resolve, reject) => ytsearch(url, (err, r) => err ? reject(err) : resolve(r)));
				var data = await ytsr(query);
				if(!data) return res(undefined);
				res(data);
			}) 
		}

		if(type == "sc") {
			return new Promise(async (res, rej) => {
				const search = await getSongs(this.PlayerManager.pm, `scsearch: ${query}`);
				if(!search) return res(undefined);
				res(search);
			})
		}


	}

	async joinVoiceChannel(channel) {
		this._checkCache(channel.guild)

		var serverCache = this.cache.get(channel.guild.id)

		serverCache.connection = await this.PlayerManager.pm.join({
            guild: channel.guild.id,
            channel: channel.id,
            host:this.node.host
        }, { selfdeaf: true });

	}

	async play(song, guild, type) {

		this._checkCache(guild)
		const serverCache = this.cache.get(guild.id)

		if(!song.track) { 
			var songs = await getSongs(this.PlayerManager.pm, `ytsearch: ${song.title} by ${song.author.name}`)
			song = songs[0]
		}

		console.log(song)

		serverCache.player = await serverCache.connection.play(song.track)
		return serverCache.connection
	}


	async leaveVoiceChannel(guild) {
		this._checkCache(guild)
		var serverCache = this.cache.get(guild.id)
		return this.PlayerManager.pm.leave(guild.id)
	}

	_checkCache(guild) {
		if(!this.cache) this.cache = new Discord.Collection()
		if(!this.cache.has(guild.id)) this.cache.set(guild.id, {
			connection: null,
			player: null
		})
	}

}

async function getSongs(player, search) {
    const node = player.nodes.first();

    const request = require("node-superfetch");

    const params = new URLSearchParams();
    params.append("identifier", search);

    let result;
    try {
        result = await request.get(`http://${node.host}:${node.port}/loadtracks?${params.toString()}`)
            .set('Authorization', node.password);
        } catch (e) {
            return e.message;
        };
    return result.body.tracks;
};

module.exports = PlayerManager