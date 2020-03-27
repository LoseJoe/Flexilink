const configs = require('./../guildConfigs.json')
module.exports = {

  aliases:["settings"],
  args:0,
  botInVoiceChannel:false,
  botPermission:36785216,
  broken:false,
  bypass:false,
  category:"utility",
  cooldown:5,
  cooldownType:"USER",
  description:"Configs For Flexiboat.",
  enabled:true,
  name:"config",
  needsQueue:false,
  nsfw:false,
  usage:"<list/disable/enable/set> (config) (default/#channel/high/med/low)",
  userInVoiceChannel:false,
  userPermission:0,
  voteLock:false,

  execute(message, args) {

    var config = configs[args.slice(1)[0]]

    if(!args[0]) return message.channel.send("Must Specify <disable/enable, list or set>.")

    if(args[0] == "list") {
      return message.channel.send(Object.keys(configs))
    }

    if(!config) return message.channel.send("You didn't write a config, or it didn't exist! use f!config <disable/enable/set> (config here).")

    if(args[0] == "disable") {
      delete message.guild.database.config[config.c_name]
      return message.channel.send(`Disabling: ${args.slice(1)[0]}`)
    }

    if(args[0] == "enable") {
      message.guild.database.config[config.c_name] = config.default
      return message.channel.send(`Enabling: **${args.slice(1)[0]}** Automatically Set To **${config.default}**`)
    }

    if(args[0] == "set") {
      setting = args.slice(1)[0]
      value = args.slice(2).join("")

      if(!value) return message.channel.send("You Need To Specify A Value To Set The Config To!")

      if(config.type == "string") {
        if(value.length > 15) return message.channel.send("String Value Is Too Long!")
        message.guild.database.config[config.c_name] = value;
      }

      if(config.type == "channel") {
        channel = message.mentions.channels.first() || message.guild.channels.find(k => k.name == value) || message.guild.channels.get(value);
        if(!channel) return message.channel.send("Could Not Find Channel Specified.")
        message.guild.database.config[config.c_name] = value;
      }

      if(config.type == "choice") {
        if(!config.choices.includes(value)) return message.channel.send("That isn't a valid option. Your options are: " + config.choices.join(", "))
        message.guild.database.config[config.c_name] = value;
      }

      return message.channel.send(`Setting: **${setting}** to **${value}**`)
    }

    return message.channel.send("That isn't an option. Please use <enable, disable, list, or set>.")

  }
}