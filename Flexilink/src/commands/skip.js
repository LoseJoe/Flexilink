module.exports = {

	aliases:["next", "sk"],
	args:0,
	botInVoiceChannel:false,
	botPermission:19456,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Skips A Song In The Queue.",
	enabled:true,
	name:"skip",
	needsQueue:true,
	nsfw:false,
	usage:"(number in queue)",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)
		if(!args[0]) { 

			if(serverQueue.player.type == "track") serverQueue.player.stopTrack()
    		if(serverQueue.player.type == "livestream") serverQueue.player.end()
    			
			message.channel.send("Skipping...")
			return;
		}

		if(isNaN(args[0])) return message.channel.send("Index Must Be A Number!")
	
		message.channel.send(`Removing **${serverQueue.songs[parseInt(args[0])].title}** from the queue.`)
		serverQueue.songs[parseInt(args[0])].info = "REPLACED"

	}

};



























