const Discord = require('discord.js')
const client = new Discord.Client({fetchAllMembers:true, disableEveryone: true})

client.login("TOKEN")
prefix = "/"

const lib = require('Flexilink') //Once on npm replace with Flexilink

const nodes = [
	{name:"Node Test #1", host:"localhost", port:69, password:"youshallnotpass"}
]

const PlayerManager = new lib({client, nodes})
const queues = new Discord.Collection();

client.on("error", console.error);
client.on("warn", console.warn);

client.on("message", async msg => {
    console.log(msg.content)
    if (msg.author.bot || !msg.guild) return;
    if (!msg.content.startsWith(prefix)) return;
    const serverQueue = queues.get(msg.guild.id);
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const node = PlayerManager.nodes[0]

    console.log("Executing Command: " + command)

    if(command === "play") {

    	//check if member is in the voice channel
    	if(!msg.member.voice.channel) return msg.channel.send("You must be in a voice channel for this command.")

    	//get data for search

    	var searchResults = await node.loadTracks(args.join(" "))
        if(!searchResults.videos[0]) return msg.channel.send("No Songs Found.")
    	var songs = searchResults.videos

        //Handle the video

    	return handleVideo(msg, msg.member.voice.channel, songs[0]) // grab the first song
    }

    if(command === "skip") {
        if (!serverQueue) return msg.channel.send("This server doesn't have a queue");
        
        if (serverQueue.playing === false) serverQueue.playing = true;
        
        serverQueue.connection.dispatcher.end();
        return msg.channel.send("Song skipped.");
    }

    if(command === "stop") {
        if (!serverQueue) return msg.channel.send("This server doesn't have a queue");
        
        node.leaveVoiceChannel(msg.guild);
        serverQueue.delete(msg.guild)

        return msg.channel.send("Stopped.");
    }

    if(command === "pause") {
        if (!serverQueue) return msg.channel.send("This server doesn't have a queue");
        
        serverQueue.connection.dispatcher.pause()

        return msg.channel.send("paused.");
    }

    if(command === "resume") {
        if (!serverQueue) return msg.channel.send("This server doesn't have a queue");
        
        serverQueue.connection.dispatcher.resume()

        return msg.channel.send("resumed.");
    }

    if(command === "loop") {
        if (!serverQueue) return msg.channel.send("This server doesn't have a queue");
        
        serverQueue.loop = !serverQueue.loop;
        return msg.channel.send(`🔁 ${serverQueue.loop ? "Enabled." : "Disabled."}`)
        
    }

    if(command === "queue") {
        if (!serverQueue) return msg.channel.send("This server doesn't have a queue");
        
        let index = 1;
        return msg.channel.send(`**__Current Queue:__**\n\n${serverQueue.songs.map(song => `**${index++}.** ${song.title}`).splice(0, 10).join("\n")}\n${serverQueue.songs.length <= 10 ? "" : `And ${serverQueue.songs.length - 10} more..`}`);
        
    }

    if(command === "nowplaying" || command === "np") {
        if (!serverQueue) return msg.channel.send("This server doesn't have a queue");
        
        return msg.channel.send(`Now playing: **${serverQueue.songs[0].title}** by *${serverQueue.songs[0].author.name}*`)
    }





    if(command === "help") return msg.reply("```play, skip, stop, pause, resume, loop, queue, nowplaying```")

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
            node.leaveVoiceChannel(msg.guild)  //leave the voice channel
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