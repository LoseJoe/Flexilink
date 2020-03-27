var Discord = require('discord.js')
const ytpl = require("ytpl")

module.exports = {

	aliases:["music", "p", "pl"],
	args:1,
	botInVoiceChannel:false,
	botPermission:37047360,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Plays music from youtube (livestreams/playlists).",
	enabled:true,
	name:"play",
	needsQueue:false,
	nsfw:false,
	usage:"(sc/yt/url/playlist) <song name/playlistID or Link>",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(msg, args) {

		if(args[0].toLowerCase == "playlist") {
			return parsePlaylist(args[1], msg)
		}

		if(args[0].toLowerCase() == "yt" || args[0].toLowerCase() == "sc" || args[0].toLowerCase() == "url") {
			type = args[0].toLowerCase()
		} else {
			type = "yt"
		}

		const node = getIdealNode(msg.client.PlayerManager)

        //get data for search

        var data = await node.loadTracks(args.join(" "), type)
        if (!data.tracks[0]) return msg.channel.send("No Songs Found.")

        data.playlists.map(list => {
            data.tracks.push(list)
        })

        while (data.tracks.length > 5) {
            data.tracks.pop()
        }


        songs = data.tracks

        var i = 0

        var songEmbed = new Discord.MessageEmbed()
        songEmbed.setTitle(`__**Songs:**__`);
        songEmbed.setColor("RANDOM")
        songs.map(s => {
            i++;
            return songEmbed.addField(`**${s.author.name}**: `, `**${i}. ${s.title}**`)
        })
        songEmbed.setFooter("Type 1-5 To Select, Or Cancel To Cancel")

        msg.channel.send({
            "embed": songEmbed
        })

        const filter = m => m.author.id == msg.author.id && m.channel.id == msg.channel.id

        collector = new Discord.MessageCollector(msg.channel, filter, {
            time: 15000
        })

        collector.on('end', (collected, reason) => {
            if (reason == "nomsg") return;
            msg.channel.send("The Menu Has Timed Out.")
            return;
        })

        collector.on('collect', async (output) => {
            if (output.content.toLowerCase().includes('cancel')) {
                collector.stop("nomsg")
                msg.channel.send("Canceled The Menu.")
                return;
            }

            if (isNaN(output.content.toLowerCase())) {
                msg.channel.send("Please Type A Number!")
                return;
            }

            if (output.content > songs.length || output.content < 1) {
                msg.channel.send(`Those Are Not Options, Please Type 1-${songs.length}`)
                return;
            }

            const song = songs[parseInt(output) - 1]
            collector.stop("nomsg")

            if (song.type == "list") {
                return await parsePlaylist(song, msg)
            }
            //if(song.info.length > 3600000) return msg.channel.send("The limit is 1 Hour.")

            return handleVideo(msg, msg.member.voice.channel, song)

        })
		
	}

};


async function handleVideo(msg, voiceChannel, song) {

    const node = getIdealNode(msg.client.PlayerManager) // get first node

    let serverQueue = msg.client.queues.get(msg.guild.id);
    song.requestedBy = msg.author;
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel,
            connection: null,
            node: node,
            songs: [song],
            volume: 10,
            playing: true,
            loop: false,
            bassboostgain: 0
        };
        msg.client.queues.set(msg.guild.id, queueConstruct);

        try {

            await node.join(voiceChannel, {mute:false, deaf:true})

            play(voiceChannel, queueConstruct.songs[0]);

        } catch (error) {

            console.log(`I could not join the voice channel: `);
            console.log(error)
            msg.client.queues.delete(msg.guild.id);
            node.leave(voiceChannel) //leave the voice channel
            return msg.channel.send(`I could not join the voice channel: ${error.message}`);

        };
    } else {
        serverQueue.songs.push(song);
        return serverQueue.textChannel.send(`Successfully added **${song.title}** to queue!`);
    };
    return;
};

async function play(voiceChannel, song) {
    let serverQueue = voiceChannel.client.queues.get(voiceChannel.guild.id);
    if (!song) {
        serverQueue.textChannel.send("No more queue to play. The player has been stopped")
        serverQueue.node.leave(voiceChannel);
        voiceChannel.client.queues.delete(voiceChannel.guild.id);
        return;
    } else {
        serverQueue.player = await serverQueue.node.play(song, voiceChannel)

        if(serverQueue.player.type == "track") serverQueue.player.setEqualizer(Eq(voiceChannel.client.config, serverQueue.bassboostgain))

        serverQueue.player.once("end", data => {
            if(data && data.reason === "REPLACED") return;
            console.log("Song has ended...");

            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(voiceChannel, serverQueue.songs[0])
        });
        if(serverQueue.player.type == "track") serverQueue.player.setVolume(serverQueue.volume);
        return serverQueue.textChannel.send(`Now playing: **${song.title}** by *${song.author.name}*`);
    };
};

async function parsePlaylist(song, message) {
		const ytplsr = (id) => new Promise((resolve, reject) => ytpl(id, (err, r) => err ? reject(err) : resolve(r)))
		if(!song.listId) return message.channel.send("No List ID Specified.")
		var data = await ytplsr(song.listId);

			tmp = {
				videoId:data.items[0].id,
				title:data.items[0].title,
				url:data.items[0].url_simple,
				author:data.items[0].author
			}

			handleVideo(message, message.member.voice.channel, tmp)

			serverQueue = msg.client.queues.get(message.guild.id);
			data.items.shift()
			data.items.map(item => {
				console.log(item)
				itemtmp = {
					videoId:item.id,
					title:item.title,
					url:item.url_simple,
					author:item.author
				}
				serverQueue.songs.push(itemtmp)
			})
		return message.channel.send(`Loaded ${data.items.length} Tracks!`)
}

async function parsePlaylistURL(url, message) {
		const ytplsr = (id) => new Promise((resolve, reject) => ytpl(id, (err, r) => err ? reject(err) : resolve(r)))
		var data = await ytplsr(url);

			tmp = {
				videoId:data.items[0].id,
				title:data.items[0].title,
				url:data.items[0].url_simple,
				author:data.items[0].author
			}

			handleVideo(message, message.member.voice.channel, tmp)

			serverQueue = msg.client.queues.get(message.guild.id);
			data.items.shift()
			data.items.map(item => {
				console.log(item)
				itemtmp = {
					videoId:item.id,
					title:item.title,
					url:item.url_simple,
					author:item.author
				}
				serverQueue.songs.push(itemtmp)
			})
		return message.channel.send(`Loaded ${data.items.length} Tracks!`)
}

function Eq(configs, bassboostgain) {

    var bands = [
        { "band": 0, "gain": 0.1875 },
        { "band": 1, "gain": 0.1875 },
        { "band": 2, "gain": 0.125 },
        { "band": 3, "gain": 0.125 },
        { "band": 4, "gain": 0.0625 },
        { "band": 5, "gain": 0.0625 }
    ]

    tmp = []

    bands.map(band => {
        band.gain = band.gain + bassboostgain
        tmp.push(band)
    })

    return tmp

}


function getIdealNode(PlayerManager) {
	return PlayerManager.nodes.first()
}




















