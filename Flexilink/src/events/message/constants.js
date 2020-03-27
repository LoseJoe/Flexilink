module.exports = {
    async execute(Bot, message) {
    	if(message.channel.type == "dm") return;
  		if(!message.client.queues[message.guild.id]) message.client.queues[message.guild.id] = {}
  		if(!message.client.queues[message.guild.id].songs) message.client.queues[message.guild.id].songs = []
    }
}