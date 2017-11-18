const ACTIVITY_TYPES = [
  {
    regex: /^p(lay(ing)?)?$/,
    type: 'PLAYING'
  },
  {
    regex: /^s(tream(ing)?)?$/i,
    type: 'STREAMING'
  },
  {
    regex: /^l(isten(ing)?)?$/i,
    type: 'LISTENING'
  },
  {
    regex: /^w(atch(ing)?)?$/i,
    type: 'WATCHING'
  }
]

exports.run = async (bot, msg, args) => {
  if (bot.commands.get('lastfm') && bot.commands.get('lastfm').nowPlaying) {
    return msg.error('Last.fm listener is currently handling your activity message!')
  }

  if (!args.length) {
    await bot.user.setPresence({ activity: null })
    return msg.success('Cleared your activity!')
  }

  const parsed = bot.utils.parseArgs(args, ['s:', 't:'])

  let stream = null
  if (parsed.options.s) {
    const append = !/^https?:\/\/(www\.)?twitch\.tv\//i.test(parsed.options.s)
    stream = `${append ? 'https://www.twitch.tv/' : ''}${parsed.options.s}`
  }

  let type = stream ? 'STREAMING' : 'PLAYING'
  // No need to check t option if stream URL was set
  if (parsed.options.t && !stream) {
    type = null
    for (const ACTIVITY_TYPE of ACTIVITY_TYPES) {
      if (ACTIVITY_TYPE.regex.test(parsed.options.t)) {
        type = ACTIVITY_TYPE.type
        break
      }
    }
    if (type === 'STREAMING') {
      type = 'PLAYING'
    } else if (!type) {
      return msg.error('That type is not available!')
    }
  }

  const game = parsed.leftover.join(' ') || stream

  await bot.user.setPresence({
    activity: {
      name: game,
      url: stream,
      type
    }
  })

  return msg.success(`Activity updated! - ${bot.utils.formatActivityType(type)} **${game}**${stream ? ` (URL: ${stream})` : ''}`)
}

exports.info = {
  name: 'setactivity',
  usage: 'setactivity <activity>',
  description: 'Sets your activity (can only be seen by other people)',
  aliases: ['setgame'],
  options: [
    {
      name: '-s',
      usage: '-s <url>',
      description: 'Sets your streaming URL to http://twitch.tv/<url> (will forcibly sets activity type to Streaming)'
    },
    {
      name: '-t',
      usage: '-t <type>',
      description: 'Sets your activity type (Playing, Streaming, Listening, Watching)'
    }
  ]
}
