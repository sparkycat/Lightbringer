exports.run = async (bot, msg, args) => {
  const parsed = bot.utils.parseArgs(args, ['np', 'ne'])

  if (!parsed.options.ne && !bot.utils.hasEmbedPermission(msg.channel)) {
    return msg.error('No permission to use embed in this channel! Try to use `-ne` option?')
  }

  const keyword = parsed.leftover.join(' ')

  if (msg.guild) {
    await msg.edit(`${consts.p}Updating guild members information\u2026`)
    await msg.guild.members.fetch()
  }

  let user = bot.utils.getMemberThenUser(msg.guild, keyword, msg.author)

  if (!user || !user.length) {
    return msg.error('No matches found!')
  } else if (user.length > 1) {
    return msg.error(bot.utils.formatFoundList(user, 'tag', { name: 'members' }), 30000)
  } else {
    user = user[0]
  }

  const member = msg.guild && msg.guild.member(user)
  const mention = bot.utils.isKeywordMentionable(keyword)

  let avatarURL = user.displayAvatarURL({ size: 2048 })

  if (!avatarURL) {
    return msg.error('Could not get display avatar of the specified user!')
  }

  if (parsed.options.np) {
    avatarURL = avatarURL.replace('cdn.discordapp.com', 'images.discordapp.net')
  }

  if (/\.gif\?size=\d*?$/.test(avatarURL)) {
    avatarURL += '&f=.gif'
  }

  const message = !keyword.length
    ? 'My avatar:'
    : (mention ? `${user}'s avatar:` : `Avatar of the user which matched the keyword \`${keyword}\`:`)
  const description = `[Click here to view in a browser](${avatarURL})`

  let append = ''
  if (msg.guild && !member) {
    append = '\n*This user is not a member of the current guild.*'
  }

  if (parsed.options.ne) {
    return msg.edit(`${mention ? user : user.tag}'s avatar:\n${avatarURL}\n${append}`)
  } else {
    return msg.edit(message, {
      embed: bot.utils.embed(user.tag, description + append, [], {
        color: member ? member.displayColor : 0,
        image: avatarURL
      })
    })
  }
}

exports.info = {
  name: 'avatar',
  usage: 'avatar [options] [user]',
  description: 'Display full image size of yours or another user\'s avatar',
  aliases: ['ava'],
  options: [
    {
      name: '-np',
      usage: '-np',
      description: 'No proxy URL (e.i. use images.discordapp.com instead of cdn.discordapp.com - workaround for when Discord\'s CDNs do not work properly)'
    },
    {
      name: '-ne',
      usage: '-ne',
      description: 'No embed display (workaround for channels in which the user do not have permission to post embeds)'
    }
  ]
}
