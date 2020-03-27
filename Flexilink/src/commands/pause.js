module.exports = {

	aliases:[],
	args:0,
	botInVoiceChannel:true,
	botPermission:19456,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Pauses Currently Playing Song.",
	enabled:true,
	name:"pause",
	needsQueue:true,
	nsfw:false,
	usage:"",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)

		var cache = serverQueue.node.getCache(message.guild.id)
		serverQueue.player.playing = false
    
    	if(serverQueue.player.type == "track") serverQueue.player.setPaused(true)
    	if(serverQueue.player.type == "livestream") cache.connection.dispatcher.pause()

		return message.channel.send("Pausing..")

	}

};



























