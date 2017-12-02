const { Listener } = require('discord-akairo')

class MissingPermissionsListener extends Listener {
  constructor () {
    super('missingPermissions', {
      emitter: 'commandHandler',
      event: 'missingPermissions'
    })
  }

  async exec (message, command, type, missing) {
    await message.status.error(
      `Could not execute \`${command}\` command due to missing permissions: ` +
      missing.map(m => `\`${m}\``).join(', '),
      15000 // timeout (15s)
    )

    this.client.commandHandler.clearStatus(message)
  }
}

module.exports = MissingPermissionsListener
