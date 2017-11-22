exports.run = async (bot, msg, args) => {
  const parsed = bot.utils.parseArgs(args, ['r', 'o', 'f:'])

  if (!msg.guild && !parsed.options.f) {
    return msg.error('This command must be used in a guild unless you specify a guild with the `-f` option!')
  }

  if (!bot.utils.hasEmbedPermission(msg.channel)) {
    return msg.error('No permission to use embed in this channel!')
  }

  if (!parsed.leftover.length) {
    return msg.error('You must specify a role name!')
  }

  const keyword = parsed.leftover.join(' ')

  let guild = msg.guild
  if (parsed.options.f) {
    guild = bot.utils.getGuild(parsed.options.f)
    try {
      bot.utils.assertGetResult(guild, { name: 'guilds' })
      guild = guild[0]
    } catch (err) { return msg.error(err) }
  }

  let role = bot.utils.getGuildRole(guild, keyword)
  try {
    bot.utils.assertGetResult(role, { name: 'roles' })
    role = role[0]
  } catch (err) { return msg.error(err) }

  const mention = bot.utils.isKeywordMentionable(keyword, 1)

  if (parsed.options.r) {
    await msg.edit(`${consts.p}Fetching guild members\u2026`)
    await guild.members.fetch()
  }

  let members = role.members

  if (parsed.options.o) {
    members = members.filter(m => {
      return (m.user.id === bot.user.id ? bot.user.settings.status : m.user.presence.status) !== 'offline'
    })
  }

  const message = mention
    ? `Members of ${keyword}:`
    : `Members of the role which matched the keyword \`${keyword}\`:`
  const membersMap = members.map(m => m.user.tag).sort((a, b) => a.localeCompare(b))

  return msg.edit(message, {
    embed: bot.utils.formatEmbed(
      role.name,
      `**ID:** ${role.id}\n` +
      `**Guild:** ${guild.name} (ID: ${guild.id})\n` +
      (membersMap.includes(bot.user.tag) ? '*You are a member of this role.*\n' : '') +
      bot.utils.formatCode(membersMap.join(', '), 'css'),
      [],
      {
        color: role.hexColor
      }
    )
  })
}

exports.info = {
  name: 'inrole',
  usage: 'inrole [options] <role name>',
  description: 'Shows a list of members which have the specified role',
  options: [
    {
      name: '-r',
      usage: '-r',
      description: 'Re-fetches all guild members (recommended with large guild)'
    },
    {
      name: '-o',
      usage: '-o',
      description: 'Lists online members only'
    },
    {
      name: '-f',
      usage: '-f <guild name>',
      description: 'Uses a certain guild instead'
    }
  ]
}
