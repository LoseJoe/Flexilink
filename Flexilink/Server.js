const config = require('./src/config.json');
const Discord = require('discord.js');
const Client = new Discord.Client()
const fs = require('fs');

Client.db = require('quick.db');
Client.config = config;
Client.queues = new Discord.Collection()
Client.Flexilink = require('flexilink')

Client.PlayerManager = new Client.Flexilink({
	client:Client,
	nodes:Client.config.flexilinkNodes
})

Client.login(config.botToken);

fs.readdir("./src/event", (err, files) => {
	if(err) return console.log(err)
	files.forEach(file => {
		if(!file.endsWith('.js')) return;
		const event = require(`./src/event/${file}`);
		let eventName = file.split(".")[0];
		Client.on(eventName, event.bind(null, Client));
	})
})

fs.readdir("./src/", (err, srcs) => {
  if (err) return console.error(err);
  srcs.forEach(src => {
  	if(src.includes(".")) return;
    Client[src] = new Discord.Collection()
    fs.readdir(`./src/${src}`, (err, files) => {
      files.forEach(file => {
	    if (!file.endsWith(".js")) return;
	    console.log(`Loading /${src}/${file}`)
        properties = require(`./src/${src}/${file}`)
        Client[src].set(properties.name, properties)
      })
    })
  })
})