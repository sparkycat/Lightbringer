const moment = require('moment')

const NOTIFICATIONS = {
  EVERYTHING: 'All messages',
  MENTIONS: 'Only @mentions',
  NOTHING: 'Nothing',
  INHERIT: 'Inherit preference from parent'
}

const TYPES = {
  dm: 'DM',
  group: 'Group DM',
  text: 'Text',
  voice: 'Voice',
  category: 'Category',
  unknown: 'Unknown'
}

exports.run = async (bot, msg, args) => {
  const parsed = bot.utils.parseArgs(args, ['r', 'f:'])

  if (!bot.utils.hasEmbedPermission(msg.channel)) {
    return msg.error('No permission to use embed in this channel!')
  }

  let channel = msg.channel
  let mention
  let guild
  let keyword

  if (parsed.leftover.length) {
    keyword = parsed.leftover.join(' ')

    guild = msg.guild
    if (parsed.options.f) {
      guild = bot.utils.getGuild(parsed.options.f)
      try {
        bot.utils.assertGetResult(guild, { name: 'guilds' })
        guild = guild[0]
      } catch (err) { return msg.error(err) }
    }

    channel = bot.utils.getChannel(keyword, guild, true)
    try {
      bot.utils.assertGetResult(channel, { name: 'channels' })
      channel = channel[0]
    } catch (err) { return msg.error(err) }

    mention = bot.utils.isKeywordMentionable(keyword, 2)
  }

  let name = channel.name || 'N/A'
  let description = ''

  if (channel.guild) {
    description = `**Guild:** ${channel.guild.name} (ID: ${channel.guild.id})`
  }

  if (channel.recipient) {
    name = `DM with ${channel.recipient.tag}`
    description = `**User ID:** ${channel.recipient.id}`
  }

  const informationFields = [
    {
      name: 'ID',
      value: channel.id
    },
    {
      name: 'Type',
      value: TYPES[channel.type]
    },
    {
      name: 'Created',
      value: `${moment(channel.createdAt).format(bot.consts.mediumDateFormat)} ` +
        `(${bot.utils.fromNow(channel.createdAt)})`
    }
  ]

  if (channel.parent) {
    informationFields.push(
      {
        name: 'Parent',
        value: `${channel.parent.name} (ID: ${channel.parent.id})`
      },
      {
        name: 'Position',
        value: `${channel.position + 1} out of ${channel.parent.children.size}`
      }
    )
  }

  const miscellaneousFields = []

  if (channel.type === 'text') {
    miscellaneousFields.push(
      {
        name: 'Notifications',
        value: NOTIFICATIONS[channel.messageNotifications]
      },
      {
        name: 'Muted',
        value: bot.utils.formatYesNo(channel.muted)
      },
      {
        name: 'NSFW',
        value: bot.utils.formatYesNo(channel.nsfw)
      }
    )
  }

  if (channel.type === 'voice') {
    miscellaneousFields.push(
      {
        name: 'Bitrate',
        value: channel.bitrate
      },
      {
        name: 'Full',
        value: bot.utils.formatYesNo(channel.full)
      },
      {
        name: 'Joinable',
        value: bot.utils.formatYesNo(channel.joinable)
      },
      {
        name: 'Speakable',
        value: bot.utils.formatYesNo(channel.speakable)
      },
      {
        name: 'User limit',
        value: channel.userLimit ? channel.userLimit.toLocaleString() : 'unlimited'
      }
    )
  }

  let iconURL

  if (channel.type === 'group') {
    name = `Group DM owned by ${channel.owner.tag}`
    description = `**Owner ID:** ${channel.ownerID}`

    if (channel.managed) {
      informationFields.push(
        {
          name: 'Application ID',
          value: channel.applicationID
        }
      )
    }

    iconURL = channel.iconURL({ size: 256 })
    informationFields.push(
      {
        name: 'Icon',
        value: iconURL
          ? `[${bot.utils.getHostName(iconURL) || 'Click here'}](${iconURL})`
          : 'N/A'
      }
    )

    const recipientsMap = channel.recipients
      .map(r => r.tag)
      .sort((a, b) => a.localeCompare(b))

    miscellaneousFields.push(
      {
        name: 'Recipients',
        value: bot.utils.formatCode(recipientsMap.join(', '), 'css')
      }
    )
  }

  const nestedFields = [
    {
      title: 'Information',
      fields: informationFields
    }
  ]

  if (miscellaneousFields.length) {
    nestedFields.push(
      {
        title: 'Miscellaneous',
        fields: miscellaneousFields
      }
    )
  }

  const color = channel.guild ? await bot.utils.getGuildColor(channel.guild) : 0

  let message = 'Information of the currently viewed channel:'
  if (keyword) {
    if (mention) {
      message = `Information of ${keyword}:`
    } else {
      message = `Information of the channel which matched the keyword \`${keyword}\`:`
    }
  }

  return msg.edit(message, {
    embed: bot.utils.formatEmbed(name, description, nestedFields, {
      color,
      thumbnail: iconURL
    })
  })
}

exports.info = {
  name: 'channelinfo',
  usage: 'channelinfo [options] <channel name>',
  description: 'Shows info of the specified channel',
  aliases: ['channel'],
  options: [
    {
      name: '-f',
      usage: '-f <guild name>',
      description: 'Uses a certain guild instead'
    }
  ]
}
