const snekfetch = require('snekfetch')

const TIMEOUT_ID = 'lastfm_timeout'
const OFF_ID = 'lastfm_off'
const DELAY = 7500

const R_TOGGLE = /^t(oggle)?$/i
const R_CONFIG = /^c(onfig(uration)?)?$/i

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
      const apiKey = args[1]
      const username = args[2]

      if (!apiKey || !username) {
        return msg.error(`Usage: \`${bot.config.prefix}${this.info.name} config <apiKey> <username>\``)
      }

      bot.managers.config.set(this.info.name, { apiKey, username })
      return msg.success('Configuration saved!')
    } else {
      return msg.error('That action is not valid!')
    }
  }
}

const setPresenceAssets = async (artist, trackName, song) => {
  await bot.user.setPresence({
    activity: {
      application: '381084833063108608',
      name: song,
      type: 'LISTENING',
      // url: `https://www.last.fm/user/${this.config.username}`,
      details: trackName,
      state: artist,
      assets: {
        largeImage: '381417203024658432',
        smallImage: '381417397057224704',
        largeText: `${this.config.username}: ${this.totalScrobbles.toLocaleString()} scrobbles`,
        smallText: 'Scrobbling to Last.fm: Powered by Lightbringer'
      }
    }
  })
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
  usage: 'lastfm [toggle|config <apiKey> <username>]',
  description: 'Get currently playing song from Last.fm',
  examples: [
    'lastfm toggle',
    'lastfm config 12345678901234567890123456789012 MyUsername'
  ]
}
