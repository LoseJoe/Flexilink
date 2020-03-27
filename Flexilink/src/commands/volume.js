module.exports = {

	aliases:[],
	args:0,
	botInVoiceChannel:false,
	botPermission:19456,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Changes Volume For Dispatcher.",
	enabled:true,
	name:"volume",
	needsQueue:true,
	nsfw:false,
	usage:"<Number>",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)

    	if(!args[0]) return message.channel.send(`Current Volume: ${serverQueue.volume}`)

    	if(isNaN(args[0])) return message.channel.send("Volume must be a number!")

    	var cache = serverQueue.node.getCache(message.guild.id)

    	if(serverQueue.player.type == "track") serverQueue.player.setVolume(args[0])
    	if(serverQueue.player.type == "livestream") cache.connection.dispatcher.setVolume(args[0] / 10)

		serverQueue.volume = args[0]

    	return message.channel.send(`Volume set to: ${serverQueue.volume}`);
	}

};



























