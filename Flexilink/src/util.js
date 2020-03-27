//this file is to help the server 
const Discord = require('discord.js')

module.exports = {

  //sends an embed to the mod-log channel (if there is one)

  sendEmbed(message, user, cases, type) {

  	const thing = (id) => { return message.client.channels.get(id) || message.client.guilds.get(id) || id}

  	caseint = (Object.keys(cases).length || 0) + 1;

	embed = new Discord.RichEmbed()
        embed.setTitle(`${type.name} | Case #${caseint}`)
        embed.setColor(`${type.color}`)
        embed.setTimestamp(message.timestamp)
        embed.addField('User', `${user.tag} (${user})`, true)
        embed.addField('Moderator', message.author.tag, true)
        embed.addField('Reason', type.reason || `\`${message.client.config.prefix}reason ${caseint} <reason>\``, false)
        embed.setFooter(type.footer)

    guild = message.guild.database

    if(guild.config.mod_log) {
    	if(guild.config.mod_log == "disabled") return;
    	message.client.channels.get(guild.config.mod_log).send({embed}).then(m => {
    		cases[caseint] = m.id
    		message.guild.database.cases = cases
    	}).catch(err => {
    		message.channel.send(`I do not have permissions to send an embed in ${thing(guild.config.mod_log).name}`)
    	})
    }
  },

  sendEmbedChannel(message, user, cases, type, channel) {

    const thing = (id) => { return message.client.channels.get(id) || message.client.guilds.get(id) || id}

    caseint = (Object.keys(cases).length || 0) + 1;

  embed = new Discord.RichEmbed()
        embed.setTitle(`${type.name} | Case #${caseint}`)
        embed.setColor(`${type.color}`)
        embed.setTimestamp(message.timestamp)
        embed.addField('User', `${user.tag} (${user})`, true)
        embed.addField('Moderator', message.author.tag, true)
        embed.addField('Reason', type.reason, false)
        embed.setFooter(type.footer)

    guild = message.guild.database

    if(guild.config.mod_log) {
      message.client.channels.get(channel).send({embed}).then(m => {
        cases[caseint] = m.id
        message.guild.database.cases = cases
      }).catch(err => {
        message.channel.send(`I do not have permissions to send an embed in ${thing(channel).name}`)
      })
    }
  },


  oneLineEmbed(text, channel) {
    const embed = new Discord.RichEmbed()
    embed.setDescription(text)
    channel.send({embed})
  },




}

