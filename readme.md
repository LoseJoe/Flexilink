# Flexilink

A Simple Wrapper For Shoukaku!

## Documentation

Documentation is not currently coded yet.

## Creating a new client

```js

const Discord = require('discord.js');
const client = new Discord.Client();
const flexilink = require('flexilink'); //Once on npm replace with Flexilink


const nodes = [{
    name: "Node Test #1",
    host: "localhost",
    port: 2333,
    auth: "lavalinkpassword"
}]

const PlayerManager = new flexilink({
    client,
    nodes
    shoukakuOptions:{} //optional
})

```

## A Quick Example

You can find an example here: [https://github.com/](https://github.com/LoseJoe/Flexilink/blob/master/test.js)



## NPM Repository

[https://npmjs.com/package/flexilink](https://www.npmjs.com/package/flexilink)

## Shoukaku Documentation
[https://deivu.github.io/Shoukaku/?api](https://deivu.github.io/Shoukaku/?api)