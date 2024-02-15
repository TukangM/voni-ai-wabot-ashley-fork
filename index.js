require("./config.js");
require("dotenv").config();
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { serialize, Client } = require("./libs/serialize.js");
const Pino = require("pino");
const { Boom } = require("@hapi/boom");
const axios = require('axios');

const isPairing = process.argv.includes("--pairing");

const store = makeInMemoryStore({ logger: Pino({ level: "fatal" }).child({ level: "fatal" }) })

let timeout = 0;
async function start() {
    const auth = await useMultiFileAuthState("session");
    const zxn = makeWASocket({
        printQRInTerminal: !isPairing,
        browser: isPairing
            ? [ "Ubuntu", "Chrome", "20.0.04" ]
            : [ "Ubuntu", "Chrome", "20.0.04" ],
        auth: auth.state,
        logger: Pino({ level: "fatal" }).child({ level: "fatal" })
    });
    store.bind(zxn.ev);
    zxn.ev.on("contacts.update", (update) => {
            for(let contact of update) {
                    let id = jidNormalizedUser(contact.id);
                    if(store && store.contacts) store.contacts[id] = { id, name: contact.notify };
            }
    });
    await Client({ zxn, store });

    if (isPairing && !zxn.authState.creds.registered) {
        const botNumber = global.bot;
        setTimeout(async function () {
                        console.log("Voni Assistant".main, ">>", `Login using number: +${botNumber}`.warn)
            const pairingCode = await zxn.requestPairingCode(botNumber);
            console.log("Voni Assistant".main, ">>", "Your pairing code: ".info, pairingCode.brightBlue);
        }, 30000);
    }

    zxn.ev.on("creds.update", auth.saveCreds);
    zxn.ev.on("connection.update", async (update) => {
            const { lastDisconnect, connection, qr } = update
              if (connection) {
                console.info("Voni Assistant".main, ">>", `Connection Status : ${connection}`.info)
                    }

            if(timeout > 30) {
                    console.log("Voni Assistant".main, ">>", `Session logout after 30 times reconnecting, This action will save your number from banned!`.warn);
                    return zxn.logout();
            }
            if (connection === "close") {
              let reason = new Boom(lastDisconnect?.error)?.output.statusCode
        if (reason === DisconnectReason.badSession) {
                console.log("Voni Assistant".main, ">>", `Bad Session File, Please Delete Session and Scan Again`.warn)
          process.exit(0)
        } else if (reason === DisconnectReason.connectionClosed) {
                timeout++
          console.log("Voni Assistant".main, ">>", "Connection closed, reconnecting....".warn)
          await start()
        } else if (reason === DisconnectReason.connectionLost) {
                timeout++
          console.log("Voni Assistant".main, ">>", "Connectionn Lost from Server, reconnecting...".warn)
          await start()
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log("Voni Assistant".main, ">>", "Connection Replaced, Another New Session Opened, Please Close Current Session First".warn)
          process.exit(1)
        } else if (reason === DisconnectReason.loggedOut) {
          console.log("Voni Assistant".main, ">>", `Device Logged Out, Please Scan Again And Run.`.warn)
          process.exit(1)
        } else if (reason === DisconnectReason.restartRequired) {
          console.log("Voni Assistant".main, ">>", "Restart Required, Restarting...".warn)
          await start()
        } else if (reason === DisconnectReason.timedOut) {
          console.log("Voni Assistant".main, ">>", "Connection TimedOut, Reconnecting...".warn)
          process.exit(0)
        } else if (reason === DisconnectReason.multideviceMismatch) {
          console.log("Voni Assistant".main, ">>", "Multi device mismatch, please scan again".warn)
          process.exit(0)
        } else {
          timeout++
          console.log("Voni Assistant".main, ">>", reason.warn)
          await start()
        }
     }

     if (connection === "open") {
       console.log("Voni Assistant".main, ">>", `Client connected on: ${zxn?.user?.id.split(":")[0] || global.bot}`.info);
       zxn.sendMessage(global.owner[0] + "@s.whatsapp.net", {
         text: `${zxn?.user?.name || "Voni Assistant"} has Connected...`,
       })
      }
    })
zxn.ev.on("messages.upsert", async ({ messages }) => {
  let m = await serialize(zxn, messages[0], store);
  try {
    if (m.fromMe) return;
    if(/status@broadcast/.test(m.key.remoteJid)) return;
    if(m.key.remoteJid.endsWith("@g.us")) return;

    if (m.body.startsWith("help")) {
      zxn.sendPresenceUpdate("composing", m.from);
      return zxn.reply(m, `Halo *${m.pushName}*, Terima kasih sudah menggunakan program kami!

Ini adalah menu bantuan pengguna, Kamu bisa membaca bagian yang ingin kamu ketahui untuk mengetahui fungsi dan cara kerja perintah.

*# help*
> Perintah help digunakan untuk menampilkan menu bantuan pengguna, biasanya berisi dari banyak informasi perintah yang tersedia.

*# gambarkan*
> Perintah gambarkan digunakan untuk meminta voni membuatkan gambar dari imajinasi yang kamu tulis di chat whatsapp, pastikan kamu menggunakan perintah dengan benar agar voni dapat memberi balasan.
> *Cara pakai:* gambarkan pantai dengan banyak pohon kelapa di pesisirnya

Tadi itu adalah informasi dan cara penggunaan perintah yang tersedia, saya harap kamu senang saat menggunakan program kecerdasan buatan yang kami kembangkan ini. Selamat bersenang-senang!`)
    } else if (m.body.startsWith("gambarkan")) {
      zxn.sendPresenceUpdate("composing", m.from);
      zxn.sendMessage(m.from, { text: "Baik, aku akan berusaha menggambarkannya untukmu" }, { quoted: m });
      const { body } = m;
      const bimg = await axios.get(global.api.znapi.base + `ai/bimg?apikey=${global.api.znapi.key}&prompt=${body.replace("gambarkan", "")}`);
      const data = bimg?.data;
      console.log("BIMG:", data)
      if(!data.status) return zxn.reply(m, `Maaf, voni tidak dapat merespon, silahkan coba lagi.`);
      zxn.sendPresenceUpdate("composing", m.from);
      const { images } = data?.result;
      return zxn.sendMedia(m.from, images[0], m, { caption: "Gambarnya udah jadi nih!", mimetype: "image/png" });
    } else {
      zxn.sendPresenceUpdate("composing", m.from);
      const chatId = "fOcMMZWuLbRmwNxZtlS9XR-6gxf6-3yZ6BWp-40gtAI";
      const cai = await axios.get(global.api.cai.base + `chat?id=${chatId}&text=${m.body}`);
      const data = cai.data.result;
      console.log("CAI:", data)
      return zxn.sendMessage(m.from, { text: `${data.text}` }, { quoted: m });
    }
  } catch (e) {
    console.log(e);
    zxn.sendPresenceUpdate("composing", m.from);
    return zxn.sendMessage(m.from, { text: `Maaf, bisa kamu katakan itu lagi?` });
  }
});

    zxn.ev.on("call", async(json) => {
      for(const id of json) {
        if(id.status == "offer") {
          if(id.isGroup == false) {
            await zxn.sendMessage(id.from, {
              text: `Maaf, saya tidak bisa menerima panggilan telpon anda.`,
              mentions: [id.from]
            });
            await zxn.rejectCall(id.id, id.from);
          } else {
            await zxn.rejectCall(id.id, id.from);
          }
        }
      }
    });
}

start();