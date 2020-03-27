module.exports = {

	aliases:["stop", "leave", "st"],
	args:0,
	botInVoiceChannel:true,
	botPermission:19456,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Stops All Songs.",
	enabled:true,
	name:"stop",
	needsQueue:true,
	nsfw:false,
	usage:"",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)
			if(serverQueue.player.type == "track") node.leave(serverQueue.voiceChannel);
    		if(serverQueue.player.type == "livestream") serverQueue.voiceChannel.leave()	
    	message.client.queues.delete(message.guild.id)
		return message.channel.send("Stopping Music...")

	}

};



























