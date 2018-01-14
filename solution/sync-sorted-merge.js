'use strict'

module.exports = (logSources, printer) => {

  let sortedLogs = logSources.map(source => source.pop()).sort((a, b) => {
  	a = a.date
  	b = b.date
    return a - b
  })

  sortedLogs.forEach(logEntry => {
    printer.print(logEntry)
  })

	printer.done()
}