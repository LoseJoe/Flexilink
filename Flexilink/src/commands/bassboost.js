const ms = require('ms')
module.exports = {

  aliases:[],
  args:0,
  botInVoiceChannel:false,
  botPermission:85056,
  broken:false,
  bypass:false,
  category:"music",
  cooldown:5,
  cooldownType:"USER",
  description:"Bass Boosts The Current Song Playing.",
  enabled:true,
  name:"bassboost",
  needsQueue:true,
  nsfw:false,
  usage:"<multiplier>",
  userInVoiceChannel:true,
  userPermission:0,
  voteLock:false,
  
  execute(message, args) {

		var serverQueue = message.client.queues.get(message.guild.id)

		if(serverQueue.player.type == "livestream") return message.channel.send("Cannot Bassboost On Livestreams.")

		if(!args[0]) return message.channel.send(`Current Bassboost Strength: ${serverQueue.bassboostgain * 8}x`)

		if(isNaN(args[0])) return message.channel.send("Multiplier Needs To Be A Number, For Example 2 For 2x Volume.");

		if(JSON.parse(args[0]) > 8) return message.channel.send("The Highest You Can Bassboost Is 8x.")

		serverQueue.bassboostGain = args[0] / 8

		bands = Eq(message.client.config, args[0]/8)

		console.log(bands)

		if(!bands) return;

		serverQueue.player.setEqualizer(bands)

		return message.channel.send(`Bassboost Set To ${args[0]}x.`)

	}

}

function Eq(configs, bassboostgain) {

	console.log(bassboostgain)

    const bands = [
    	{ "band": 0, "gain": 0.1875 },
        { "band": 1, "gain": 0.1875 },
        { "band": 2, "gain": 0.125 },
        { "band": 3, "gain": 0.125 },
        { "band": 4, "gain": 0.0625 },
        { "band": 5, "gain": 0.0625 }
    ]

    tmp = []

    bands.map(band => {
        band.gain = band.gain + bassboostgain
        tmp.push(band)
    })

    return tmp

}