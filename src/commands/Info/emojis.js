exports.run = async (bot, msg, args) => {
  if (!bot.utils.hasEmbedPermission(msg.channel)) {
    return msg.error('No permission to use embed in this channel!')
  }

  const parsed = bot.utils.parseArgs(args, ['r', 'f:', 'g'])

  let guild = msg.guild
  if (parsed.options.f) {
    guild = bot.utils.getGuild(parsed.options.f)
  } else if (parsed.options.r) {
    guild = bot.guilds.random()
  }

  if (!guild) {
    return msg.error('This command can only be used in a guild!')
  }

  const emojis = guild.emojis
  if (!emojis.size) {
    return msg.error('The guild does not have any emojis!')
  }

  if (parsed.options.g) {
    await msg.edit('🔄\u2000Uploading to GitHub Gists\u2026')
    const r = await bot.utils.gists(require('util').inspect(emojis.map(e => {
      return { name: e.name, url: e.url }
    })), { suffix: 'js' })
    return msg.success(`<${r}>`, { timeout: -1 })
  } else {
    const color = await bot.utils.getGuildColor(guild)
    return msg.edit(msg.content, {
      embed: bot.utils.formatLargeEmbed('', '',
        {
          delimeter: ' ',
          children: emojis.map(e => e.toString())
        },
        {
          author: {
            name: `Emojis of ${guild.name} [${emojis.size}]`,
            icon: guild.iconURL
          },
          color
        }
      )
    })
  }
}

exports.info = {
  name: 'emojis',
  usage: 'emojis [options]',
  description: 'Gets the emojis of the current guild',
  aliases: ['emoji', 'emote', 'emotes'],
  options: [
    {
      name: '-r',
      usage: '-r',
      description: 'Uses a random guild instead (not to be used with -l)'
    },
    {
      name: '-f',
      usage: '-f <guild name>',
      description: 'Uses a certain guild instead (not to be used with -r)'
    },
    {
      name: '-g',
      usage: '-g',
      description: 'Dumps emoji names and URLs to GitHub Gists'
    }
  ],
  examples: [
    'emojis',
    'emojis -f "discord.js official"'
  ]
}
