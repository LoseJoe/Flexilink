const Discord = require('discord.js')
module.exports = {

  aliases:['q', 'que'],
  args:0,
  botInVoiceChannel:false,
  botPermission:19456,
  broken:false,
  bypass:false,
  category:"music",
  cooldown:5,
  cooldownType:"USER",
  description:"See The Current Queue.",
  enabled:true,
  name:"queue",
  needsQueue:true,
  nsfw:false,
  usage:"",
  userInVoiceChannel:true,
  userPermission:0,
  voteLock:false,
  
  execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)
		let index = 1;

        return message.channel.send(`**__Current Queue:__**\n\n${serverQueue.songs.map(song => `**${index++}.** ${song.title}`).splice(0, 10).join("\n")}\n${serverQueue.songs.length <= 10 ? "" : `And ${serverQueue.songs.length - 10} more..`}`);

	}

};


