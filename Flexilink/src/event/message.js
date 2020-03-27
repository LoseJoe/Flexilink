const fs = require('fs')

module.exports = async (Bot, msg) => {

  fs.readdir(`${__dirname}/../events/message`, (err, files) => {
  	files.map(f => {
  	  var event = require(`${__dirname}/../events/message/${f}`)
  	  event.execute(Bot, msg)
  	})
  })

};