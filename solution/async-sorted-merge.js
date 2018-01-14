
'use strict'

module.exports = (logSources, printer) => {
    let promisedLogs = logSources.map(source => {
      return source.popAsync()
    })

    Promise.all(promisedLogs).then(sortedLogs => {
      sortedLogs.sort((a, b) => {
        a = new Date(a.date)
        b = new Date(b.date)
        return a - b
      })

      sortedLogs.forEach(logEntry => {
        printer.print(logEntry)
      })

  		printer.done()
    })
}