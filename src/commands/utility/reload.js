const { Command } = require('discord-akairo')

const TYPE_STRINGS = ['Command', 'Inhibitor', 'Listener']

class ReloadCommand extends Command {
  constructor () {
    super('reload', {
      aliases: ['reload', 'r'],
      description: 'Reloads commands, inhibitors and/or listeners.',
      args: [
        {
          id: 'all',
          match: 'flag',
          prefix: ['--all', '-a'],
          description: 'Reloads all commands, inhibitors and listeners.'
        },
        {
          id: 'type',
          match: 'prefix',
          prefix: '--type=',
          description: 'Reloads module of a specific type. This will reload all modules of that type when being used with "all" flag.',
          type: (word, message, args) => {
            args._type = Boolean(word.length)
            if (/^c(ommand(s)?)?$/i.test(word)) return 0
            if (/^i(nhibitor(s)?)?$/i.test(word)) return 1
            if (/^l(istener(s)?)?$/i.test(word)) return 2
          }
        },
        {
          id: 'module',
          match: 'text',
          allow: (message, args) => !args.all,
          type: (word, message, args) => {
            args._module = Boolean(word.length)
            if (args.type === 1) return this.client.inhibitorHandler.modules.get(word)
            if (args.type === 2) return this.client.listenerHandler.modules.get(word)
            return this.client.commandHandler.findCommand(word)
          }
        }
      ]
    })
  }

  async exec (message, args) {
    const typeString = TYPE_STRINGS[args.type || 0].toLowerCase()
    if (args.module) {
      if (args.module.reload()) {
        return message.status.success(`Reloaded ${typeString}: \`${args.module.id}\`.`)
      } else {
        return message.status.error(`Could not reload ${typeString}: \`${args.module.id}\`!`)
      }
    } else if (args.all) {
      if (args.type === 0 || args.type === null) this.handler.reloadAll()
      if (args.type === 1 || args.type === null) this.client.inhibitorHandler.reloadAll()
      if (args.type === 2 || args.type === null) this.client.listenerHandler.reloadAll()
      if (args.type === null) {
        return message.status.success('Reloaded all commands, inhibitors and listeners.')
      } else {
        return message.status.success(`Reloaded all ${typeString}s.`)
      }
    } else if (args._type && args.type === null) {
      return message.status.error('That type is not available! Try either `commands`, `inhibitors` or `listeners`!')
    } else if (args._module) {
      return message.status.error('Could not find a module with that ID!')
    } else {
      return message.status.error('You must specify the ID of the module that you want to reload!')
    }
  }
}

module.exports = ReloadCommand