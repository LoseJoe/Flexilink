module.exports = {

	aliases:["skto"],
	args:1,
	botInVoiceChannel:false,
	botPermission:19456,
	broken:false,
	bypass:false,
	category:"music",
	cooldown:5,
	cooldownType:"USER",
	description:"Moves You To A Certain Part In Your Queue.",
	enabled:true,
	name:"skipto",
	needsQueue:true,
	nsfw:false,
	usage:"<number in queue>",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)
		
		if(isNaN(args[0])) return message.channel.send("Index Must Be A Number!");

		songNumber = parseInt(args[0])

		if(songNumber < 1 || songNumber > serverQueue.songs.length) {
			return message.channel.send("Please Enter A Valid Song Number.")
		}

		serverQueue.songs.splice(0, songNumber - 2);
		if(serverQueue.player.type == "track") serverQueue.player.stopTrack()
    	if(serverQueue.player.type == "livestream") serverQueue.player.end()
		return;

	}

};



























