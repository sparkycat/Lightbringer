const moment = require('moment')

const VERIFICATION_LEVELS = [
  'None',
  'Low (must have verified email)',
  'Medium (registered on Discord for longer than 5 minutes)',
  'High (a member of the server for longer than 10 minutes)',
  'Insane (must have verified phone)'
]

const EXPLICIT_CONTENT_FILTERS = [
  'No scan',
  'Scan from members without a role',
  'Scan from all members'
]

const CHANNEL_TYPES = {
  category: 'C',
  text: 'T',
  voice: 'V'
}

const CHANNEL_PRIORITY = {
  category: 2,
  text: 0,
  voice: 1
}

const NOTIFICATIONS = {
  EVERYTHING: 'All messages',
  MENTIONS: 'Only @mentions',
  NOTHING: 'Nothing',
  INHERIT: 'Inherit preference from parent'
}

const R_ROLES = /^r(oles)?$/i
const R_MEMBERS = /^m(ember(s)?)?$|^u(ser(s)?)?$/i
const R_CHANNELS = /^c(hannel(s)?)?$/i
const R_ONLINE = /^o(nline)?$/i

exports.run = async (bot, msg, args) => {
  const parsed = bot.utils.parseArgs(args, ['r', 'f:', 'g'])

  if (!msg.guild && !parsed.options.f) {
    return msg.error('This command must be used in a guild unless you specify a guild with the `-f` option!')
  }

  if (!bot.utils.hasEmbedPermission(msg.channel)) {
    return msg.error('No permission to use embed in this channel!')
  }

  let guild = msg.guild
  if (parsed.options.f) {
    guild = bot.utils.getGuild(parsed.options.f)
    try {
      bot.utils.assertGetResult(guild, { name: 'guilds' })
      guild = guild[0]
    } catch (err) { return msg.error(err) }
  }

  if (parsed.options.r) {
    await msg.edit(`${consts.p}Fetching guild members\u2026`)
    await guild.members.fetch()
  }

  const iconURL = guild.iconURL({ size: 256 })
  const splashURL = guild.splashURL({ size: 2048 })

  let gists
  let embed

  if (parsed.leftover.length) {
    let title
    let map
    let code
    let delimeter
    let footer

    const channelSort = (a, b) => CHANNEL_PRIORITY[a.type] - CHANNEL_PRIORITY[b.type] || a.position - b.position

    const formatMissingPerms = channel => {
      let missing = []

      if (!channel.permissionsFor(guild.me).has('VIEW_CHANNEL')) {
        missing.push('#no-view')
      }
      if ((channel.type === 'text') && !channel.permissionsFor(guild.me).has('SEND_MESSAGES')) {
        missing.push('#no-send')
      }
      if ((channel.type === 'voice') && !channel.permissionsFor(guild.me).has('CONNECT')) {
        missing.push('#no-connect')
      }

      return missing.length ? ` ${missing.join(' ')}` : ''
    }

    const action = parsed.leftover[0]

    if (R_ROLES.test(action)) {
      title = `Roles in ${guild.name}`
      map = guild.roles
        .sort((a, b) => b.position - a.position)
        .map(r => r.name)
      delimeter = ', '
    } else if (R_MEMBERS.test(action)) {
      title = `Members in ${guild.name}`
      map = guild.members
        .map(m => m.user.tag)
        .sort((a, b) => a.localeCompare(b))
      code = 'css'
      delimeter = ', '
    } else if (R_CHANNELS.test(action)) {
      title = `Channels in ${guild.name}`
      let ordered = []
      guild.channels
        .filter(c => !c.parentID)
        .sort(channelSort)
        .forEach(c => {
          ordered.push(c)
          if (c.children) {
            const childrenArray = c.children
              .sort(channelSort)
              .array()
            ordered = ordered.concat(childrenArray)
          }
        })
      map = ordered
        .map(c => `[${CHANNEL_TYPES[c.type]}] ${c.name}${formatMissingPerms(c)}`)
      code = 'css'
      delimeter = '\n'
      footer = 'Ps. C = Categories, T = Text and V = Voice'
    } else if (R_ONLINE.test(action)) {
      title = `Online members in ${guild.name}`
      map = guild.members
        .filter(m => (m.user.id === bot.user.id ? bot.user.settings.status : m.user.presence.status) !== 'offline')
        .map(m => m.user.tag)
        .sort((a, b) => a.localeCompare(b))
      code = 'css'
      delimeter = ', '
    } else {
      return msg.error('That action is not valid!')
    }

    if (parsed.options.g) {
      gists = map.join(delimeter)
    } else {
      embed = bot.utils.formatEmbed('', bot.utils.formatCode(map.join(delimeter), code), [], {
        author: {
          name: `${title} [${map.length}]`,
          icon: iconURL
        },
        footer,
        truncate: false
      })
    }
  } else {
    const text = guild.channels.filter(c => c.type === 'text')
    const voice = guild.channels.filter(c => c.type === 'voice')
    const category = guild.channels.filter(c => c.type === 'category')
    const online = guild.members.filter(m => {
      return (m.user.id === bot.user.id ? bot.user.settings.status : m.user.presence.status) !== 'offline'
    })

    const nestedFields = [
      {
        title: 'Guild Information',
        fields: [
          {
            name: 'ID',
            value: guild.id
          },
          {
            name: guild.owner ? 'Owner' : 'Owner ID',
            value: guild.owner ? `${guild.owner.user.tag} (ID: ${guild.owner.id})` : guild.ownerID
          },
          {
            name: 'Created',
            value: `${moment(guild.createdAt).format(bot.consts.mediumDateFormat)} (${bot.utils.fromNow(guild.createdAt)})`
          },
          {
            name: 'Region',
            value: guild.region
          },
          {
            name: 'Verification',
            value: VERIFICATION_LEVELS[guild.verificationLevel]
          },
          {
            name: 'Filter',
            value: EXPLICIT_CONTENT_FILTERS[guild.explicitContentFilter]
          },
          {
            name: 'System channel',
            value: guild.systemChannel ? `${guild.systemChannel.name} (ID: ${guild.systemChannel.id})` : 'N/A'
          }
        ]
      },
      {
        title: 'Statistics',
        fields: [
          {
            name: 'Channels',
            value: `${guild.channels.size} – ${category.size} categor${category.size === 1 ? 'y' : 'ies'}, ${text.size} text and ${voice.size} voice`
          },
          {
            name: 'Members',
            value: `${guild.memberCount} – ${online.size} online`
          },
          {
            name: 'Roles',
            value: `${guild.roles.size} – ${guild.me.roles.size - 1} owned`
          }
        ]
      },
      {
        title: 'Miscellaneous',
        fields: [
          {
            name: 'Notifications',
            value: NOTIFICATIONS[guild.messageNotifications]
          },
          {
            name: 'Mobile push',
            value: bot.utils.formatYesNo(guild.mobilePush)
          },
          {
            name: 'Muted',
            value: bot.utils.formatYesNo(guild.muted)
          }
        ]
      }
    ]

    if (splashURL) {
      // Push to Guild Information section
      nestedFields[0].fields.push({
        name: 'Splash image',
        value: `[${bot.utils.getHostName(splashURL) || 'Click here'}](${splashURL})`
      })
    }

    embed = bot.utils.formatEmbed('', '', nestedFields, {
      thumbnail: iconURL,
      author: {
        name: guild.name,
        icon: iconURL
      },
      footer: `Ps. Currently caching ${guild.members.size.toLocaleString()} guild members\u2026`
    })
  }

  if (parsed.options.g && gists) {
    await msg.edit('🔄\u2000Uploading to GitHub Gists\u2026')
    const r = await bot.utils.gists(gists)
    return msg.success(`<${r}>`, { timeout: -1 })
  } else {
    const color = await bot.utils.getGuildColor(guild)
    const message = parsed.options.f
      ? `Information of the guild which matched the keyword \`${parsed.options.f}\`:`
      : 'Information of the currently viewed guild:'
    return msg.edit(message, {
      embed: embed.setColor(color)
    })
  }
}

exports.info = {
  name: 'guildinfo',
  usage: 'guildinfo [options] [roles|members|channels|online]',
  description: 'Shows info of the server you are in',
  aliases: ['guild', 'server', 'serverinfo'],
  options: [
    {
      name: '-r',
      usage: '-r',
      description: 'Re-fetches all guild members (recommended with large guild)'
    },
    {
      name: '-f',
      usage: '-f <guild name>',
      description: 'Displays information of a particular guild instead'
    },
    {
      name: '-g',
      usage: '-g',
      description: 'Uploads to GitHub Gists (to be used with `roles`, `members` or `channels`)'
    }
  ],
  examples: [
    'guildinfo',
    'guildinfo roles',
    'guildinfo -f "discord.js official"'
  ]
}
