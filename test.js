const Discord = require('discord.js')
const client = new Discord.Client({
    fetchAllMembers: false,
    disableEveryone: true
})
const ytpl = require('ytpl')
const ms = require('ms')

client.login("bot token here")
prefix = "/"

const lib = require('./libraryV2.js') //Once on npm replace with Flexilink

const nodes = [{
    name: "Node Test #1",
    host: "localhost",
    port: 2333,
    auth: "password",
}]

const bassboost_bands = [
            { band: 0, gain: 0.1875 },
            { band: 1, gain: 0.1875 },
            { band: 2, gain: 0.125 },
            { band: 3, gain: 0.125 },
            { band: 4, gain: 0.0625 },
            { band: 5, gain: 0.0625 }
    ]

const neutral_bands = [
            { band: 0, gain: 0.0 },
            { band: 1, gain: 0.0 },
            { band: 2, gain: 0.0 },
            { band: 3, gain: 0.0 },
            { band: 4, gain: 0.0 },
            { band: 5, gain: 0.0 }
]

const PlayerManager = new lib({
    client,
    nodes
})
const queues = new Discord.Collection();

client.on("ready", () => {
	console.log("Bot connected.")
})

client.on("error", console.error);
client.on("warn", console.warn);

client.on("message", async msg => {
    if (msg.author.bot || !msg.guild) return;
    if (!msg.content.startsWith(prefix)) return;
    const serverQueue = queues.get(msg.guild.id);
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const node = PlayerManager.nodes.first()

    console.log("Executing Command: " + command)

    if (command === "play") {

        //check if member is in the voice channel
        if (!msg.member.voice.channel) return msg.channel.send("You must be in a voice channel for this command.")

        //get data for search

        var data = await node.loadTracks(args.join(" "), "yt")
        if (!data.tracks[0]) return msg.channel.send("No Songs Found.")

        data.playlists.map(list => {
            data.tracks.push(list)
        })

        while (data.tracks.length > 5) {
            data.tracks.pop()
        }


        songs = data.tracks

        i = 0

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

if (command === "skip") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    if (serverQueue.playing === false) serverQueue.playing = true;

    serverQueue.player.stopTrack();
    return msg.channel.send("Song skipped.");
}

if (command === "stop") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    node.leave(msg.guild);
    queues.delete(msg.guild.id)

    return msg.channel.send("Stopped.");
}

if (command === "pause") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    serverQueue.player.playing = false
    serverQueue.player.setPaused(true)


    return msg.channel.send("paused.");
}

if (command === "resume") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    serverQueue.player.playing = true
    serverQueue.player.setPaused(false)
    return msg.channel.send("resumed.");
}

if (command === "loop") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    serverQueue.loop = !serverQueue.loop;
    return msg.channel.send(`🔁 ${serverQueue.loop ? "Enabled." : "Disabled."}`)

}

if (command === "bassboost") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    serverQueue.bassboost = !serverQueue.bassboost;

    serverQueue.player.setEqualizer(serverQueue.bassboost ? bassboost_bands : neutral_bands)

    return msg.channel.send(`Bassboost: ${serverQueue.bassboost ? "Enabled." : "Disabled."}`)

}

if (command === "queue") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    let index = 1;
    return msg.channel.send(`**__Current Queue:__**\n\n${serverQueue.songs.map(song => `**${index++}.** ${song.title}`).splice(0, 10).join("\n")}\n${serverQueue.songs.length <= 10 ? "" : `And ${serverQueue.songs.length - 10} more..`}`);

}

if (command === "nowplaying" || command === "np") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    return msg.channel.send(`Now playing: **${serverQueue.songs[0].title}** by *${serverQueue.songs[0].author.name}*`)
}

if (command === "volume") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    if(!args[0]) return msg.channel.send(`Current Volume: ${serverQueue.volume}`)

    if(isNaN(args[0])) return msg.channel.send("Volume must be a number!")

    serverQueue.player.setVolume(args[0])
	serverQueue.volume = args[0]

    return msg.channel.send(`Volume set to: ${serverQueue.volume}`);
}

if (command === "seek") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    if(!args[0]) return msg.channel.send(`Current Time: ${ms(serverQueue.player.position)}.`)

    if(isNaN(ms(args[0]))) return msg.channel.send("Could not understand that time!")

    serverQueue.player.seekTo(ms(args[0]))
    serverQueue.player.position = ms(args[0])

    return msg.channel.send(`Seeking to: ${ms(serverQueue.player.position)}`);
}




if (command === "help") return msg.reply("```play, skip, stop, pause, resume, loop, bassboost, queue, nowplaying, volume, seek```")

})

async function handleVideo(msg, voiceChannel, song) {

    const node = PlayerManager.nodes.first() // get first node

    let serverQueue = queues.get(msg.guild.id);
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
            bassboost: false
        };
        queues.set(msg.guild.id, queueConstruct);

        try {

            await node.join(voiceChannel, {mute:false, deaf:true})

            play(msg.guild, queueConstruct.songs[0]);

        } catch (error) {

            console.error(`I could not join the voice channel: ${error}`);
            queues.delete(msg.guild.id);
            node.leave(msg.guild) //leave the voice channel
            return msg.channel.send(`I could not join the voice channel: ${error.message}`);

        };
    } else {
        serverQueue.songs.push(song);
        return serverQueue.textChannel.send(`Successfully added **${song.title}** to queue!`);
    };
    return;
};

async function play(guild, song) {
    let serverQueue = queues.get(guild.id);
    if (!song) {
        serverQueue.textChannel.send("No more queue to play. The player has been stopped")
        serverQueue.node.leave(guild);
        queues.delete(guild.id);
        return;
    } else {
        serverQueue.player = await serverQueue.node.play(song, guild)

        serverQueue.player.setEqualizer(serverQueue.bassboost ? bassboost_bands : neutral_bands)

        serverQueue.player.once("end", data => {
            if(data.reason === "REPLACED") return;
            console.log("Song has ended...");

            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(guild, serverQueue.songs[0])
        });
        serverQueue.player.setVolume(serverQueue.volume);
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

			serverQueue = queues.get(message.guild.id);
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
		return message.channel.send(`Loaded ${song.videoCount} Tracks!`)
}


