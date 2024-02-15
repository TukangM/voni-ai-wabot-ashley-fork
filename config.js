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
global.bot = "62856971039021"
global.botName = "ZanixonMD | Whatsapp Bot"
global.owner = ["6285697103902"]
global.tmp = "/tmp"

let year = moment().tz('Asia/Jakarta').format('YYYY');
global.thumbnail = {
  title: "Voni Assistant",
  body: `Copyright © Zanixon Group ${year} - All right reserved`,
  thumbnail: "./zanixon/zanixonmd.png",
  mediaType: 1,
  previewType: 0,
  renderLargerThumbnail: false,
  sourceUrl: `https://trakteer.id/zanixongroup`
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