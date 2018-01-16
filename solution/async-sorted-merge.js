'use strict'

const PriorityQueue  = require('qheap')
const Rx = require('rxjs/Rx')
const co = require('co')

// pops (or reads) each log from the log sources until they are depleted
function *readLogsFromSource(logSource) {
  while(true) {
    yield logSource.popAsync()
  }
}

const mergeSortedLogs = co.wrap(function* (logs, sortBy, observer) {
  const sortByFunc = (a, b) => sortBy(a.value, b.value)
  const priorityQueue = new PriorityQueue({ comparBefore: sortByFunc })
  const enqueue = (value, sequence) => priorityQueue.insert({value, sequence})
  const dequeue = priorityQueue.remove.bind(priorityQueue)
  const queueEmpty = () => priorityQueue.length <= 0

 // starts with the earliest entry from each of the logSource which are already 'sorted'
  for (let i = 0; i < logs.length; i += 1) {
    const Entry = yield logs[i].next()

    if (!Entry.done) {
      enqueue(Entry.value, logs[i])
    }
  }

  while (!queueEmpty()) {
    const currentEntry = dequeue()

    if (currentEntry.value) {
      observer.next(currentEntry.value)
    }
    
    const nextEntry = yield currentEntry.sequence.next()

    if (!nextEntry.done && nextEntry.value) {
      enqueue(nextEntry.value, currentEntry.sequence)
    }
  }

  observer.complete()
})

// Utilize rxjs library to create an observable triggered when promises are filled
const mergeSortedLogsAsync = (logs, sortBy) =>
  Rx.Observable.create(observer => mergeSortedLogs(logs, sortBy, observer)) 

// utilize the priority queue to sort through all log entries
module.exports = (logSources, printer) => {
  const completeLogSources = logSources.map(logEntries => readLogsFromSource(logEntries))
  const sortBy = (a, b) => a.date < b.date

  const observable = mergeSortedLogsAsync(completeLogSources, sortBy)

// call printer done after observable subscription completes for summary statistics 
  observable.subscribe(
    logEntry =>  printer.print(logEntry),
    e => console.error(e),
    () => printer.done()
  )
}