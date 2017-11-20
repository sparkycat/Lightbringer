const snekfetch = require('snekfetch')

const TIMEOUT_ID = 'lastfm_timeout'
const OFF_ID = 'lastfm_off'
const DELAY = 7500

const R_TOGGLE = /^t(oggle)?$/i
const R_CONFIG = /^c(onfig(uration)?)?$/i
const R_RICH = /^r(ich)?$/i

exports.nowPlaying = ''
exports.totalScrobbles = 0

exports.init = async bot => {
  this._stats = bot.managers.stats
  this.config = bot.config[this.info.name] || {}
  startListening()
}

exports.run = async (bot, msg, args) => {
  if (!args.length) {
    return msg.edit(`🎵\u2000Currently playing on \`Last.fm\`: ${this.nowPlaying || 'N/A'}`)
  } else {
    const action = args[0]

    if (R_TOGGLE.test(action)) {
      if (!this._stats.get(OFF_ID)) {
        this._stats.set(OFF_ID, true)
        stopListening()
        await bot.user.setPresence({ activity: null })
        this.nowPlaying = ''
        return msg.success('Disabled `Last.fm` listener.')
      } else {
        this._stats.set(OFF_ID)
        startListening()
        return msg.success('Enabled `Last.fm` listener!')
      }
    } else if (R_CONFIG.test(action)) {
      if (args.length < 3) {
        return msg.error(`Usage: \`${bot.config.prefix}${this.info.name} config <apiKey> <username>\``)
      }

      this.config.apiKey = args[1]
      this.config.username = args[2]
      bot.managers.config.set(this.info.name, this.config)
      return msg.success('Configuration saved!')
    } else if (R_RICH.test(action)) {
      if (args.length < 4) {
        // lblastfm rich 381084833063108608 381417203024658432 382111360676528128
        return msg.error(`Usage: \`${bot.config.prefix}${this.info.name} rich <client id> <large image id> <small image id>\``)
      }

      this.config.rich = {
        clientId: args[1],
        largeImageId: args[2],
        smallImageId: args[3]
      }
      bot.managers.config.set(this.info.name, this.config)
      return msg.success('Configuration saved!')
    } else {
      return msg.error('That action is not valid!')
    }
  }
}

const setPresenceAssets = async (artist, trackName, song) => {
  const rich = this.config.rich
  if (!rich || !rich.clientId || !rich.largeImageId || !rich.smallImageId) {
    return bot.user.setPresence({
      activity: {
        name: `${song} | Last.fm`
      }
    })
  } else {
    return bot.user.setPresence({
      activity: {
        application: rich.clientId,
        name: song,
        type: 'LISTENING',
        details: trackName,
        state: artist,
        assets: {
          largeImage: rich.largeImageId,
          smallImage: rich.smallImageId,
          largeText: `${this.totalScrobbles.toLocaleString()} scrobbles`,
          smallText: `(ID: ${this.config.username}) Last.fm status for Discord powered by Lightbringer`
        }
      }
    })
  }
}

const stopListening = () => {
  const oldTimeout = this._stats.get(TIMEOUT_ID)

  if (oldTimeout) {
    clearTimeout(oldTimeout)
    this._stats.set(TIMEOUT_ID)
  }
}

const timeoutRecentTrack = (modifier = 1) => {
  // Call stopListening() again just in case someone
  // runs the reload command when getRecentTrack() was still running
  stopListening()

  this._stats.set(TIMEOUT_ID, setTimeout(() => getRecentTrack(), DELAY * modifier))
}

const getRecentTrack = async () => {
  if (this._stats.get(OFF_ID)) {
    return timeoutRecentTrack(2) // Next poll in 2 * 7500 = 15000 ms
  }

  let res
  try {
    res = await snekfetch.get(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&format=json&user=${this.config.username}&api_key=${this.config.apiKey}&limit=1`)
    if (res.status !== 200) {
      throw new Error(res.text)
    }
  } catch (err) {
    console.warn(`[lastfm] ${err}`)
    return timeoutRecentTrack(2) // Next poll in 2 * 7500 = 15000 ms
  }

  if (res.status !== 200 || !res.body || !res.body.recenttracks || !res.body.recenttracks.track || !res.body.recenttracks.track[0]) {
    return timeoutRecentTrack()
  }

  this.totalScrobbles = parseInt(res.body.recenttracks['@attr'].total) || this.totalScrobbles

  const track = res.body.recenttracks.track[0]
  let artist = ''
  let trackName = ''
  let song = ''

  const nowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true'
  if (nowPlaying) {
    artist = typeof track.artist === 'object' ? track.artist['#text'] : track.artist
    trackName = track.name
    song = `${artist} - ${trackName}`
  }

  if (this.nowPlaying === song) {
    return timeoutRecentTrack()
  }

  try {
    let statusChannel = bot.config.statusChannel ? bot.channels.get(bot.config.statusChannel) : null

    if (!artist || !trackName || !song) {
      await bot.user.setPresence({ activity: null })
      this.nowPlaying = ''
      if (statusChannel) {
        await statusChannel.send('🎵\u2000Cleared `Last.fm` status message!')
      }
    } else {
      // I could have made setPresenceAssets() to build its
      // own song variable, but whatever
      await setPresenceAssets(artist, trackName, song)
      this.nowPlaying = song
      if (statusChannel) {
        await statusChannel.send(`🎵\u2000\`Last.fm\`: ${song}`)
      }
    }
  } catch (err) {
    console.warn(`[lastfm] ${err}`)
  }

  return timeoutRecentTrack()
}

const startListening = () => {
  stopListening()

  if (this.config.apiKey && this.config.username) {
    getRecentTrack()
  } else {
    this._stats.set(OFF_ID, true)
  }
}

exports.info = {
  name: 'lastfm',
  usage: 'lastfm [toggle|config <apiKey> <username>|rich <client id> <large image id> <small image id>]',
  description: 'Manage last.fm scrobbling status updater',
  examples: [
    'lastfm toggle',
    'lastfm config 12345678901234567890123456789012 MyUsername',
    'lastfm rich 123456789012345678 123456789012345678 123456789012345678'
  ]
}
