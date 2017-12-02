const { Command } = require('discord-akairo')
const { escapeMarkdown } = require('discord.js').Util

class BanCommand extends Command {
  constructor () {
    super('ban', {
      aliases: ['ban'],
      description: 'Bans someone.',
      split: 'sticky',
      args: [
        {
          id: 'keyword',
          match: 'rest',
          description: 'The guild member that you want to ban.'
        },
        {
          id: 'reason',
          match: 'prefix',
          prefix: '--reason=',
          description: 'Reason for banning.'
        },
        {
          id: 'days',
          type: 'integer',
          match: 'prefix',
          prefix: ['--days=', '--day=', '--delete='],
          description: 'Number of days of messages to delete.',
          default: 0
        },
        {
          id: 'soft',
          match: 'flag',
          prefix: ['--soft', '-s'],
          description: 'Soft-ban (will immediately unban the user after the ban).'
        }
      ]
    })
  }

  async exec (message, args) {
    if (!message.guild) {
      return message.status.error('You can only use this command in a guild!')
    }

    if (!args.keyword) {
      return message.status.error('You must specify a member to ban!')
    }

    /*
     * Refresh GuildMemberStore
     */

    await message.guild.members.fetch()

    /*
     * Resolve GuildMember then ban
     */

    const resolved = this.client.util.resolveMembers(args.keyword, message.guild.members)

    if (resolved.size === 1) {
      const target = resolved.first()
      await target.ban({
        days: args.days,
        reason: args.reason
      })
      if (args.soft) {
        await message.guild.unban(target.user.id)
      }
      return message.status.success(`Successfully ${args.soft ? 'soft-' : ''}banned ${escapeMarkdown(target.user.tag)} (ID: ${target.user.id}).`, -1)
    } else if (resolved.size > 1) {
      return message.status.error(
        this.client.util.formatMatchesList(resolved, {
          name: 'members',
          prop: 'user.tag'
        }),
        this.client.util.matchesListTimeout
      )
    } else {
      return message.status.error('Could not find matching guild members!')
    }
  }
}

module.exports = BanCommand
