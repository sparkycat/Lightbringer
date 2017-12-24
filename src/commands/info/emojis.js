// NOTICE: Support for animated emotes will be added by this PR:
// https://github.com/hydrabolt/discord.js/pull/2182

const { Command } = require('discord-akairo')

class EmojisCommand extends Command {
  constructor () {
    super('emojis', {
      aliases: ['emojis', 'emoji', 'emotes', 'emote'],
      description: 'Lists emojis of the currently viewed or a specific guild.',
      args: [
        {
          id: 'keyword',
          match: 'rest',
          description: 'The guild that you want to list the emotes of. This can be an emoji instead, in which case it will display the source of the said emoji.'
        }
      ],
      options: {
        usage: 'emojis [keyword]'
      },
      clientPermissions: ['EMBED_LINKS']
    })
  }

  async exec (message, args) {
    if (!message.guild && !args.keyword) {
      return message.status.error('You must specify a guild name when running this command outside of a guild!')
    }

    const match = /<a?:\w+?:(\d+?)>/.exec(args.keyword)
    if (match && match[1]) {
      const emoji = this.client.emojis.get(match[1])
      if (emoji) {
        return message.edit(`${this.formatEmoji(emoji)} is from ${emoji.guild.name} (ID: ${emoji.guild.id}).`)
      }
    }

    let guild = message.guild

    // Assert Guild.
    if (args.keyword) {
      guild = await this.client.util.assertGuild(args.keyword)
    }

    let emojis = guild.emojis

    const embed = {
      title: `${guild.name} [${emojis.size}]`,
      description: emojis.map(e => this.formatEmoji(e)).join('\u2000')
    }

    let content = `Emojis of the currently viewed guild:`
    if (args.keyword) {
      content = `Emojis of the guild which matched \`${args.keyword}\`:`
    }

    return this.client.util.multiSendEmbed(message.channel, embed, {
      firstMessage: message,
      content,
      prefix: `**Guild ID:** ${guild.id})\n`,
      char: '\u2000'
    })
  }

  formatEmoji (emoji) {
    if (emoji.requiresColons) {
      return `${emoji.toString()} \`:${emoji.name}:\``
    } else {
      return `${emoji.toString()} \`${emoji.name}\``
    }
  }
}

module.exports = EmojisCommand
