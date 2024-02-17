const colors = require("colors");
const moment = require("moment-timezone");
require('dotenv').config();

//custom colors for beautiful console.log()
colors.setTheme({
   main: ['brightBlue', 'bold'],
   silly: 'rainbow',
   input: 'grey',
   verbose: 'cyan',
   prompt: 'grey',
   info: 'green',
   data: 'grey',
   help: 'cyan',
   warn: 'yellow',
   debug: 'blue',
   error: 'brightRed'
});

// config
global.bot = "6283838444729"
global.botName = "ZanixonMD - TukangM - SayaAEP | WhatsApp Bot / beta.character.ai"
global.owner = ["6282284960188"]
global.tmp = "/tmp"

let year = moment().tz('Asia/Jakarta').format('YYYY');
global.thumbnail = {
  title: "Ashley character.ai Assistant",
  body: `Copyright © TukangM - ZanixonMD ${year} - All right reserved`,
  thumbnail: "./zanixon/furry2c.jpg",
  mediaType: 1,
  previewType: 0,
  renderLargerThumbnail: false,
  sourceUrl: `https://tukangm.github.io`
}

global.api = {
	znapi: { // register di https://api.zanixon.xyz
	  base: "https://api.zanixon.xyz/api/",
	  key: process.env.ZNAPI
	},
	cai: {
	  base: "http://pnode2.danbot.host:5807/",
	  key: null
	}
}
