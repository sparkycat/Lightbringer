const moment = require('moment')

exports.run = async (bot, msg, args) => {
  const parsed = bot.utils.parseArgs(args, ['r', 'f:'])

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

  const color = hexToRgb(role.hexColor)
  const message = mention
    ? `Information of ${keyword}:`
    : `Information of the role which matched the keyword \`${keyword}\`:`

  return msg.edit(message, {
    embed: bot.utils.formatEmbed(`${role.name}`, `**Guild:** ${guild.name} (ID: ${guild.id})`,
      [
        {
          title: 'Information',
          fields: [
            {
              name: 'ID',
              value: role.id
            },
            {
              name: 'Created',
              value: `${moment(role.createdAt).format(bot.consts.mediumDateFormat)} ` +
                `(${bot.utils.fromNow(role.createdAt)})`
            },
            {
              name: 'Position',
              value: `${guild.roles.size - role.position} out of ${guild.roles.size}`
            },
            {
              name: 'Members',
              value: `${role.members.size} – ${role.members.filter(m => {
                return (m.user.id === bot.user.id ? bot.user.settings.status : m.user.presence.status) !== 'offline'
              }).size} online`
            }
          ]
        },
        {
          title: 'Miscellaneous',
          fields: [
            {
              name: 'Hex color',
              value: role.hexColor
            },
            {
              name: 'RGB color',
              value: `(${color.r}, ${color.g}, ${color.b})`
            },
            {
              name: 'Hoisted',
              value: bot.utils.formatYesNo(role.hoist)
            },
            {
              name: 'Managed',
              value: bot.utils.formatYesNo(role.managed)
            },
            {
              name: 'Mentionable',
              value: bot.utils.formatYesNo(role.mentionable)
            }
          ]
        }
      ],
      {
        color: role.hexColor
      }
    )
  })
}

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null
}

exports.info = {
  name: 'roleinfo',
  usage: 'roleinfo [options] <role name>',
  description: 'Shows info of the specified role',
  aliases: ['role'],
  options: [
    {
      name: '-r',
      usage: '-r',
      description: 'Re-fetches all guild members (recommended with large guild)'
    },
    {
      name: '-f',
      usage: '-f <guild name>',
      description: 'Uses a certain guild instead'
    }
  ]
}
