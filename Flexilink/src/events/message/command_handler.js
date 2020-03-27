const config = require("../../config.json")
const util = require("../../util.js")

const Discord = require('discord.js')
const DBL = require('dblapi.js')
const dbl = new DBL(config.topGGToken)

module.exports = {
    async execute(Bot, message) {

        if (message.channel.type == "dm" || message.author.bot) return;

        //Set the util variable for easy access

        message.util = util

        //If the guild database doesn't exist create it. if it does put it in a variable.

        message.guild.database = await Bot.db.fetch(`guild-${message.guild.id}`)
        if (!message.guild.database) {
        	Bot.db.set(`guild-${message.guild.id}`, Bot.config.defaultGuildDB); 
        	message.guild.database = Bot.config.defaultGuildDB
    	}

        const msg = message.content.toLowerCase();

        //If the guild has a prefix set, set the prefix variable to it, if not set it to the default.

        if (message.guild.database.config.prefix) var prefix = message.guild.database.config.prefix;
        if (!prefix) var prefix = Bot.config.prefix;

        //Check if the message starts with prefix or mention, if not return.

        if (!(msg.startsWith(prefix) || msg.startsWith(`<@${Bot.user.id}> `) || msg.startsWith(`<@!${Bot.user.id}> `))) return;

        //If the user database doesn't exist, create it. if it does, put it in a variable.

        message.author.database = await Bot.db.fetch(`user-${message.author.id}`)
        if (!message.author.database) {
        	Bot.db.set(`user-${message.author.id}`, {}); 
        	message.author.database = {}
        }

     

        //If the message starts with the prefix, set args regularly, if its a mention, slice the mention off (@flexiboat ).

        if (msg.startsWith(prefix)) var args = message.content.slice(prefix.length).split(/\s+/);
        if (!args) var args = message.content.split(/\s+/).slice(1);

        //Get the command object from the collection.

        const CommandName = args.shift().toLowerCase();
        const Command = Bot.commands.get(CommandName) || Bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(CommandName));

        //If the command doesn't exist, react with X.

        if (!Command) return message.react("❌");

        //Checking for all options

        if (Command.args) if (args.length < Command.args) return message.channel.send(`\nThe Proper Usage Would Be: \`${prefix}${Command.name} ${Command.usage}\`.`);
        if (Command.botInVoiceChannel) if (!message.guild.me.voice.channel) return message.channel.send(`I Need To Be In A Voice Channel Before You Can Execute This Command.`)
        if (Command.botPermission) if (!message.guild.me.permissions.has(parseInt(Command.botPermission))) return message.channel.send(`I Do Not Have Enough Permissions To Perform This Action.`);
        if (Command.broken) return message.channel.send(`This Command Is Temporarly Out Of Order, Try Again Later.`);
        if (Command.bypass) if (!(Bot.config.bypass.includes(message.author.id))) return message.channel.send(`This Is A **Bypass** Only Command.`)
        if (!Command.enabled) return;
        if (Command.needsQueue) if (!message.client.queues.get(message.guild.id)) return message.channel.send("I Must Have A Queue To Execute This Command.")
        if (Command.nsfw) if (!message.channel.nsfw) return message.channel.send(`Set This Channel To NSFW Before Executing This Command!`);
        if (Command.userInVoiceChannel) if (!message.member.voice.channel) return message.channel.send(`You Need To Be In A Voice Channel Before Executing This Command!`)
        if (!Bot.config.bypass.includes(message.author.id)) if (Command.userPermission) if (!message.member.permissions.has(parseInt(Command.userPermission))) return message.channel.send(`You do not have enough permissions to run the \`${Command.name}\` command.`);
        if (Command.voteLock) {
            if (!await dbl.hasVoted(message.author.id)) {
                return message.channel.send(`Please Vote For The Discord Bot Before You Can Use This Command. Use f!vote For The Link! (it may take a few minutes to register)`)
            }
        }

        //Cooldowns

        if (!Bot.cooldowns) Bot.cooldowns = new Discord.Collection();
        if (!Bot.cooldowns.has(Command.name)) Bot.cooldowns.set(Command.name, new Discord.Collection());

        if (Command.cooldownType.toLowerCase() == "guild") var id = message.guild.id;
        if (Command.cooldownType.toLowerCase() == "channel") var id = message.channel.id;
        if (Command.cooldownType.toLowerCase() == "user") var id = message.author.id;

        const timestamps = Bot.cooldowns.get(Command.name);
        const cooldownAmount = (Command.cooldown || 5) * 1000;

        if (!timestamps.has(id)) {
            timestamps.set(id, Date.now());
            setTimeout(() => timestamps.delete(id), cooldownAmount);
        } else {

            //Time left message

            const expirtationTime = timestamps.get(id) + cooldownAmount;

            if (Date.now() < expirtationTime) {
                const timeLeft = (expirtationTime - Date.now()) / 1000;
                return message.channel.send(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the **${Command.name}** command.`);
            };

            timestamps.set(id, Date.now());
            setTimeout(() => timestamps.delete(id), cooldownAmount);

        };

        //Executing the command

        try {

            Command.execute(message, args)

            message.react("☑")

            console.log(message.guild.database)

            Bot.db.set(`guild-${message.guild.id}`, message.guild.database);
            Bot.db.set(`user-${message.author.id}`, message.author.database);
            
        } catch (error) {

            console.log(error)
            return message.react("⚠")

        }


    }
}