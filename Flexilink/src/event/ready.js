const fs = require('fs')

module.exports = async (Bot) => {

  fs.readdir(`${__dirname}/../events/ready`, (err, files) => {
  	files.map(f => {
  	  var event = require(`${__dirname}/../events/ready/${f}`)
  	  event.execute(Bot)
  	})
  })

};