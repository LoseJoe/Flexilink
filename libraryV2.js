const { Manager } = require('lavacord')
const Discord = require('discord.js')
const ytsearch = require('yt-search')

class Flexilink {
	constructor(options) {
		if(!options) return console.log("Please Specify PlayerManager Options.")
		if(!options.client) return console.log("'client' Is Not Defined In PlayerManager Options.")
		if(!options.nodes) return console.log("'nodes' Is Not Defined In PlayerManager Options.")

		this.client = options.client;
		this.nodesArray = options.nodes;
		this.nodes = new Discord.Collection()

		this.client.on("ready", () => {
			this.manager = new Manager(this.nodesArray, this.client, {
				user:this.client.user.id,
				shards: this.client.shard ? this.client.shard.count : 0
			})

			this.manager.on("error", (err, node) => {
				console.log(node + ` Has Created An Error: ` + err)
			})

			this.nodesArray.map(nodeInfo => {
				nodeInfo.manager = this.manager
				if(!node.name) return console.log("A Node Doesn't Have A Name!")
				this.nodes.set(node.name, new node(nodeInfo))
			})

			console.log("Flexilink Loaded.")
		})
	}
}

class node {
	constructor(info) {
		if(!info) return console.log("Please Specify Node Options.")
		if(!info.name) return console.log("One Or More Of The Nodes Dont Have A Name!")
		if(!info.host) return console.log(`${info.name} Doesn't Have A Host!`)
		if(!info.port) return console.log(`${info.name} Doesn't Have A Port!`)
		if(!info.password) return console.log(`${info.name} Doesn't Have A Password!`)
		if(!info.manager) return console.log(`Couldn't find manager for ${info.name}`)
		this.node = info
		this.cache = new Discord.Collection()
	}

	loadTracks(query, type) {
		if(!query) return console.log("Specify Query 1rst Argument On loadTracks()")
		if(!type) return console.log("Specify Type 2nd Argument On loadTracks() Types: yt, sc")
		if(type == "yt") {
			return new Promise(async (res, rej) => {
				const ytsr = (url) => new Promise((resolve, reject) => ytsearch(url, (err, r) => err ? reject(err) : resolve(r)));
				var data = await ytsr(query);
				if(!data) return res(undefined);
				res(parseInfo(data));
			}) 
		}

		if(type == "sc") {
			return new Promise(async (res, rej) => {
				const search = await getSongs(this.node.manager, `scsearch: ${query}`);
				if(!search) return res(undefined);
				res(parseInfo(search));
			})
		}


	}

	async join(channel) {
		if(!channel) return console.log("Specify Option 'Channel' In Join Options.");
		if(!channel.guild) return console.log("Couldn't Find Guild In 'channel' 'join(channel)'")

		this._checkCache(channel.guild.id); // guild id
		var serverCache = this.cache.get(channel.guild.id);

		serverCache.player = await this.node.manager.join({
			guild:channel.guild.id,
			channel:channel,
			host:this.node.host
		});

		return serverCache.player;
	
	}

	async leave(guild) {
		if(!guild) return console.log("Specify Option 'Guild', In Leave Options.");
		if(!guild.id) return console.log("Couldn't Find ID In 'guild' 'leave(guild)'");

		this._checkCache(guild.id);
		var serverCache = this.cache.get(guild.id);

		serverCache.player = null;
		var result = await this.node.manager.leave(guild.id);

		return result

	}

	_checkCache(guild) {
		if(!this.cache.has(guild)) this.cache.set(guild, {
			connection: null,
			player: null
		})
	}


	
}

async function getSongs(manager, search) {
    const node = manager.nodes.get(undefined)

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

function parseInfo(info) {

	var parsedInfo = {
		tracks: [],
		playlists: [],
		channels: []
	}

	if(info.videos) { //Parsing Youtube Videos (from yt-search)
		if(info.videos.length) {
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

		if(info.playlists.length) {
			console.log(`Parsing ${info.playlists.length} playlists.`)
			info.playlists.map(playlist => {
				parsedInfo.playlists.push(playlist)
			})
		}

		if(info.channels.length) {
			console.log(`Parsing ${info.playlists.length} channels.`)
			info.channels.map(channel => {
				parsedInfo.channels.push(channel)
			})
		}

	}

	if(info.length) { //Parsing Lavalink Videos
		if(!Array.isArray(info)) return;
		console.log(`Parsing ${info.length} Lavalink Videos`)
		info.map(video => {
			if(!video.track) return;
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

	return parsedInfo

}



module.exports = Flexilink;