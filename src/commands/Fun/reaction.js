const DELAY = 500

exports.run = async (bot, msg, args) => {
  const parsed = bot.utils.parseArgs(args, ['m:', 'c:', 's'])
  const reactions = parsed.leftover.join(' ')

  if (!reactions.length) {
    throw new Error('No text provided to parse into reaction emojis!')
  }

  const channel = bot.utils.getChannel(parsed.options.c, msg.guild) || msg.channel

  const m = await bot.utils.getMsg(channel, parsed.options.m, msg.id)
  const emojis = bot.utils.buildEmojisArray(reactions, {
    max: 20,
    guild: msg.guild,
    unique: true
  })

  if (!emojis.length) {
    throw new Error('Unable to parse text into reaction emojis!')
  }

  if (parsed.options.s) {
    await msg.delete()
  } else {
    await msg.edit(`${PROGRESS}Reacting...`)
  }

  const sendReact = async i => {
    if (!emojis[i]) {
      return parsed.options.s ? true : msg.success('Done!')
    }

    try {
      await m.react(emojis[i])
      setTimeout(() => sendReact(i + 1), DELAY)
    } catch (err) {
      if (parsed.options.s) {
        console.error(err)
      } else {
        throw err
      }
    }
  }
  return sendReact(0)
}

exports.info = {
  name: 'reaction',
  usage: 'reaction [options] <text|emoji|both>',
  description: 'Sends reaction to the previous message',
  aliases: ['react'],
  options: [
    {
      name: '-m',
      usage: '-m <id>',
      description: 'Specify an ID of a message to react to'
    },
    {
      name: '-c',
      usage: '-c <id>',
      description: 'Specify an ID of a channel which has the message (requires -m to be set)'
    },
    {
      name: '-s',
      usage: '-s',
      description: 'Silent mode'
    }
  ]
}
