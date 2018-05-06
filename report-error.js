const getConfig = require('probot-config')

async function reportError (context, type, data) {
  let config

  try {
    config = await getConfig(context, 'report-error.yml')
    if (!config) context.log.info('Missing "report-error.yml" configuration file')
  } catch (error) {
    return postError(
      context,
      'Failed to read report-error.yml',
      'An error occurred while trying to read `report-error.yml`. Check the syntax and make sure it\'s valid'
    )
  }

  let options

  if (type && config && config[type]) {
    options = config[type]
  } else {
    options = {
      title: 'Uncaught error in probot application',
      body: 'Something went wrong in your probot application. Please check the logs to resolve this issue.'
    }
  }

  const title = replaceInString(options.title, data)
  const body = replaceInString(options.body, data)

  return postError(context, title, body)
}

function replaceInString (str, data) {
  if (!data) return str

  return Object.keys(data).reduce((acc, key) => {
    return acc.replace(new RegExp(`{{${key}}}`, 'g'), data[key])
  }, str)
}

function findIssueByTitle (issues, title) {
  return issues.find(issue => issue.title === title)
}

async function postError (context, title, body) {
  const findIssueParams = context.issue({state: 'open', 'per_page': 100})

  // Check for an existing open issue with the same title
  // Return if an open issue already exists
  let foundIssues = await context.github.issues.getForRepo(findIssueParams)
  if (findIssueByTitle(foundIssues.data, title)) return

  while (context.github.hasNextPage(foundIssues)) {
    foundIssues = await context.github.getNextPage(foundIssues)
    if (findIssueByTitle(foundIssues.data, title)) return
  }

  const createIssueParams = context.issue({title, body})

  const result = await context.github.issues.create(createIssueParams)
}

module.exports = {
  reportError,
  replaceInString
}
