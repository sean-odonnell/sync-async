'use strict'
const PriorityQueue  = require('qheap')

// pops (or reads) each log from the log sources until they are depleted
function *readLogsFromSource(logSource) {
  let logEntry = logSource.pop()

  while (logEntry !== false) {
    yield logEntry
    logEntry = logSource.pop()
  }
}

// Priority queue implementation from third party library
function *mergeLogSources(sortedLogs, sortBy) {
  const sortByFunc = (a, b) => sortBy(a.value, b.value) 
  const priorityQueue = new PriorityQueue({ comparBefore: sortByFunc });
  const enqueue = (value, sequence) => priorityQueue.insert({value, sequence});
  const dequeue = priorityQueue.remove.bind(priorityQueue);
  const empty = () => priorityQueue.length <= 0;

  // starts with the earliest entry from each of the logSource which are already 'sorted'
  for (let i = 0; i < sortedLogs.length; i += 1) {
    const entry = sortedLogs[i].next();

    if (!entry.done) {
      enqueue(entry.value, sortedLogs[i])
    }
  }

  while (!empty()) {
    const currentItem = dequeue()
    yield currentItem.value
    const nextItem = currentItem.sequence.next()

    if (!nextItem.done) {
      enqueue(nextItem.value, currentItem.sequence)
    }
  }
}

// for each log source read all logs
module.exports = (logSources, printer) => {
  const completeLogSources = logSources.map(logs => readLogsFromSource(logs))
  const sortBy = (a, b) => a.date < b.date

// utilize the priority queue to sort through all log entries 
  const merged = mergeLogSources(completeLogSources, sortBy)
  	for(let logEntry of merged) {
    	printer.print(logEntry)
  	}

// call printer done for summary statistics 
  printer.done()
}