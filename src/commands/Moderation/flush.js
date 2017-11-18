exports.run = async (bot, msg, args) => {
  const parsed = bot.utils.parseArgs(args, 'r:')
  const count = parseInt(parsed.leftover[0]) || 1

  if (!msg.guild || !msg.channel.permissionsFor(msg.guild.me).has('MANAGE_MESSAGES')) {
    return msg.error('You do not have permission to flush messages by bots!')
  }

  let messages = await msg.channel.messages.fetch({
    limit: Math.min(count, 100),
    before: msg.id
  })

  messages = messages.filter(m => m.author.bot)

  if (!messages.size) {
    return msg.error('There are no messages that can be deleted by user!')
  }

  await msg.edit(`${consts.p}Flushing ${messages.size} message(s)\u2026`)
  await Promise.all(messages.map(m => m.delete({ reason: parsed.options.r })))

  return msg.success(`Flushed \`${messages.size}\` message(s)!`, 3000)
}

exports.info = {
  name: 'flush',
  usage: 'flush <amount>',
  description: 'Deletes messages sent by bots',
  options: [
    {
      name: '-r',
      usage: '-r <reason>',
      description: 'Sets delete reason that will be recorded in the Audit Log'
    }
  ]
}
