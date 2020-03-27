module.exports = {

	aliases:["loop"],
	args:0,
	botInVoiceChannel:true,
	botPermission:19456,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Loops The Current Song.",
	enabled:true,
	name:"loop",
	needsQueue:true,
	nsfw:false,
	usage:"",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)
		serverQueue.loop = !serverQueue.loop;
		return message.channel.send(`🔁 ${serverQueue.loop ? "Enabled." : "Disabled."}`)

	}

};



























