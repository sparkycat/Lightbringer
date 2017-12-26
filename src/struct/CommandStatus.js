class CommandStatus {
  constructor (client, message) {
    Object.defineProperties(this, {
      client: {
        value: client
      }
    })

    const {
      commandStatusDeleteTimeout = 7500 // default
    } = client.akairoOptions

    this.message = message

    this.commandStatusDeleteTimeout = commandStatusDeleteTimeout
  }

  async _delete (options) {
    if (typeof options === 'number') {
      options = { timeout: options }
    }

    if (options === undefined || options.timeout === undefined) {
      options = { timeout: this.commandStatusDeleteTimeout }
    }

    if (options.timeout >= 0) {
      return this.message.delete(options).catch(() => {})
    }
  }

  async success (content, options) {
    return this.message.edit(`✅${content ? '\u2000' + content : ''}`)
      .then(() => this._delete(options))
  }

  async error (content, options) {
    return this.message.edit(`⛔${content ? '\u2000' + content : ''}`)
      .then(() => this._delete(options))
  }

  async question (content, options) {
    return this.message.edit(`❓${content ? '\u2000' + content : ''}`)
      .then(() => this._delete(options))
  }

  async progress (content) {
    return this.message.edit(`🔄${content ? '\u2000' + content : ''}`)
  }
}

module.exports = CommandStatus