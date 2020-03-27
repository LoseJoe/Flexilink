module.exports = {

	aliases:["now", "np"],
	args:0,
	botInVoiceChannel:false,
	botPermission:19456,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Shows Whats Currently Playing.",
	enabled:true,
	name:"nowplaying",
	needsQueue:true,
	nsfw:false,
	usage:"",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)
        return message.channel.send(`Now playing: **${serverQueue.songs[0].title}** by *${serverQueue.songs[0].author.name}*`)

	}

};



























