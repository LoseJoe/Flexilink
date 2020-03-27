const ms = require('ms')
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
	description:"Seeks To A Certain Position In A Song.",
	enabled:true,
	name:"seek",
	needsQueue:true,
	nsfw:false,
	usage:"<timestamp (1m 52s)>",
	userInVoiceChannel:true,
	userPermission:0,
	voteLock:false,
	
	async execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)

		if(serverQueue.player.type == "livestream") return message.channel.send("Cannot seek on livestreams.")
    	if(!args[0]) return message.channel.send(`Current Time: ${ms(serverQueue.player.position)}.`)

		var pos = 0 

		args.map(arg => {
			val = ms(arg)
			pos = val + pos
		})

		if(isNaN(pos)) return message.channel.send("Sorry, Couldn't Understand That Time.")

		var song = serverQueue.songs[0]

		if(song.length < pos || 0 > pos) return message.channel.send("Please Select A Timeframe In The Limit Of The Song.")

		serverQueue.player.seekTo(pos)
    	serverQueue.player.position = pos

    	return message.channel.send(`Seeking to: ${ms(serverQueue.player.position)}`);

	}

};



























