const Discord = require('discord.js')
const client = new Discord.Client({
    fetchAllMembers: true,
    disableEveryone: true
})
const ytpl = require('ytpl')

client.login("TOKEN")
prefix = "/"

const lib = require('./lib/library.js') //Once on npm replace with Flexilink

const nodes = [{
    name: "Node Test #1",
    host: "localhost",
    port: 69,
    password: "youshallnotpass"
}]

const PlayerManager = new lib({
    client,
    nodes
})
const queues = new Discord.Collection();

client.on("error", console.error);
client.on("warn", console.warn);

client.on("message", async msg => {
    if (msg.author.bot || !msg.guild) return;
    if (!msg.content.startsWith(prefix)) return;
    const serverQueue = queues.get(msg.guild.id);
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const node = PlayerManager.nodes[0]

    console.log("Executing Command: " + command)

    if (command === "play") {

        //check if member is in the voice channel
        if (!msg.member.voice.channel) return msg.channel.send("You must be in a voice channel for this command.")

        //get data for search

        var data = await node.loadTracks(args.join(" "))
        if (!data.videos[0]) return msg.channel.send("No Songs Found.")

        data.lists.map(list => {
            data.videos.push(list)
        })

        while (data.videos.length > 5) {
            data.videos.pop()
        }


        songs = data.videos

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

    serverQueue.connection.dispatcher.end();
    return msg.channel.send("Song skipped.");
}

if (command === "stop") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    node.leaveVoiceChannel(msg.guild);
    queues.delete(msg.guild.id)

    return msg.channel.send("Stopped.");
}

if (command === "pause") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    serverQueue.connection.dispatcher.pause()

    return msg.channel.send("paused.");
}

if (command === "resume") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    serverQueue.connection.dispatcher.resume()

    return msg.channel.send("resumed.");
}

if (command === "loop") {
    if (!serverQueue) return msg.channel.send("This server doesn't have a queue");

    serverQueue.loop = !serverQueue.loop;
    return msg.channel.send(`🔁 ${serverQueue.loop ? "Enabled." : "Disabled."}`)

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




if (command === "help") return msg.reply("```play, skip, stop, pause, resume, loop, queue, nowplaying```")

})

async function handleVideo(msg, voiceChannel, song) {

    const node = PlayerManager.nodes[0] // get first node

    let serverQueue = queues.get(msg.guild.id);
    song.requestedBy = msg.author;
    if (!serverQueue) {
        const queueConstruct = {
            textChannel: msg.channel,
            voiceChannel,
            connection: null,
            node: node,
            songs: [song],
            volume: 1,
            playing: true,
            loop: false
        };
        queues.set(msg.guild.id, queueConstruct);

        try {

            await node.joinVoiceChannel(voiceChannel)

            queueConstruct.connection = node.getConnection(msg.guild) //grab the connection

            play(msg.guild, queueConstruct.songs[0]);

        } catch (error) {

            console.error(`I could not join the voice channel: ${error}`);
            queues.delete(msg.guild.id);
            node.leaveVoiceChannel(msg.guild) //leave the voice channel
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
        serverQueue.node.leaveVoiceChannel(guild);
        queues.delete(guild.id);
        return;
    } else {
        await serverQueue.node.play(song, guild, "over_internet")

        serverQueue.connection.dispatcher.once("error", console.error)
        serverQueue.connection.dispatcher.once("finish", data => {
            console.log("Song has ended...");

            const shiffed = serverQueue.songs.shift();
            if (serverQueue.loop === true) {
                serverQueue.songs.push(shiffed);
            };
            play(guild, serverQueue.songs[0])
        });
        serverQueue.connection.dispatcher.setVolume(serverQueue.volume);
        console.log(song)
        return serverQueue.textChannel.send(`Now playing: **${song.title}** by *${song.author.name}*`);
    };
};

async function parsePlaylist(song, message) {
		const ytplsr = (id) => new Promise((resolve, reject) => ytpl(id, (err, r) => err ? reject(err) : resolve(r)))
		if(!song.listId) return message.channel.send("No List ID Specified.")
		var data = await ytplsr(song.listId);

			console.log(data)

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

