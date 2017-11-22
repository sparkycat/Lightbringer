const moment = require('moment')

exports.run = async (bot, msg, args) => {
  if (!bot.utils.hasEmbedPermission(msg.channel)) {
    return msg.error('No permission to use embed in this channel!')
  }

  const parsed = bot.utils.parseArgs(args, ['m'])
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

  if (parsed.options.m && user === bot.user) {
    return msg.error(`Use \`${bot.config.prefix}guilds\` command to if you want to list your own guilds!`)
  }

  let profile = {}
  try {
    profile = await user.fetchProfile()
  } catch (err) {}

  const avatarURL = user.displayAvatarURL({ size: 256 })

  if (parsed.options.m) {
    if (user.bot) {
      return msg.error('Can not get mutual guilds information from bot accounts!')
    }

    if (!profile.mutualGuilds || !profile.mutualGuilds.size) {
      return msg.error(`You and \`${user.tag}\` have no mutual guilds!`)
    }

    const thumbAvatarURL = avatarURL.replace(/\?size=\d+?$/i, '')
    const message = mention
      ? `List of mutual guilds with ${keyword}:`
      : `List of mutual guilds with the user which matched the keyword \`${keyword}\`:`

    const mutualGuilds = profile.mutualGuilds
      .sort((a, b) => a.position - b.position)
      .map(g => g.name)
      .join('\n')

    return msg.edit(message, {
      embed: bot.utils.embed('', mutualGuilds, [], {
        color: member ? member.displayColor : 0,
        author: {
          name: `Mutual guilds with ${user.tag} [${profile.mutualGuilds.size}]`,
          icon: thumbAvatarURL
        }
      })
    })
  } else {
    const description = user.presence.activity
      ? (bot.utils.formatActivityType(user.presence.activity.type)) + ` **${user.presence.activity.name}**`
      : `*${user === bot.user ? 'I don\'t have' : 'This user doesn\'t have'} activity message\u2026*`

    const nestedFields = [
      {
        title: 'User Information',
        fields: [
          {
            name: 'ID',
            value: user.id
          },
          {
            name: 'Status',
            value: user.id === bot.user.id ? bot.user.settings.status : user.presence.status
          },
          {
            name: 'Created',
            value: `${moment(user.createdAt).format(bot.consts.mediumDateFormat)} ` +
              `(${bot.utils.fromNow(user.createdAt)})`
          }
        ]
      }
    ]

    if (user.bot) {
      nestedFields[0].fields.push({
        name: 'Bot',
        value: bot.utils.formatYesNo(user.bot)
      })
    } else {
      nestedFields[0].fields.push({
        name: profile.premiumSince ? 'Nitro since' : 'Nitro',
        value: `${profile.premiumSince ? `${moment(profile.premiumSince).format(bot.consts.mediumDateFormat)} ` +
          `(${bot.utils.fromNow(profile.premiumSince)})` : 'no'}`
      })

      if (user !== bot.user) {
        nestedFields[0].fields.push({
          name: 'Mutual guilds',
          value: profile.mutualGuilds ? profile.mutualGuilds.size : '0'
        })
      }
    }

    nestedFields[0].fields.push({
      name: 'Avatar',
      value: avatarURL
        ? `[${bot.utils.getHostName(avatarURL) || 'Click here'}](${avatarURL})`
        : 'N/A'
    })

    if (member) {
      nestedFields.push({
        title: 'Guild Membership',
        fields: [
          {
            name: 'Nickname',
            value: member.nickname || 'N/A'
          },
          {
            name: 'Joined',
            value: `${moment(member.joinedAt).format(bot.consts.mediumDateFormat)} ` +
              `(${bot.utils.fromNow(member.joinedAt)})`
          }
        ]
      })

      // Slice off the first item (the @everyone)
      const roles = member.roles.array().slice(1).sort((a, b) => a.comparePositionTo(b)).reverse().map(role => {
        return role.name
      })

      nestedFields.push([`Guild Roles [${roles.length}]`, roles.length ? roles.join(', ') : 'N/A'])
    } else if (msg.guild) {
      nestedFields.push(['Guild Membership', '*This user is not a member of the currently viewed guild\u2026*'])
    }

    // const thumbAvatarURL = avatarURL.replace(/\?size=\d+?$/i, '')
    const thumbAvatarURL = avatarURL

    let message = 'My information:'
    if (keyword) {
      if (mention) {
        message = `${keyword}'s information:`
      } else {
        message = `Information of the user which matched the keyword \`${keyword}\`:`
      }
    }

    return msg.edit(message, {
      embed: bot.utils.formatEmbed('', description, nestedFields, {
        thumbnail: thumbAvatarURL,
        color: member ? member.displayColor : 0,
        author: {
          name: user.tag,
          icon: thumbAvatarURL
        }
      })
    })
  }
}

exports.info = {
  name: 'userinfo',
  usage: 'userinfo <user>',
  description: 'Shows yours or another user\'s info',
  aliases: ['info'],
  options: [
    {
      name: '-m',
      usage: '-m',
      description: 'Lists your mutual guilds with the user'
    }
  ]
}
