const getConfig = require('probot-config')
const {reportError} = require('./report-error')

module.exports = (robot) => {
  // Your code here
  robot.log('Yay, the app was loaded!')

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/

  robot.on('issues.opened', async context => {
    robot.log('Got opened issue!')

    let config

    try {
      config = await getConfig(context, 'welcome.yml')
    } catch (error) {
      return reportError(context, 'readConfig', {errorName: error.name, errorMessage: error.message})
    }


    // `context` extracts information from the event, which can be passed to
    // GitHub API calls. This will return:
    //   {owner: 'yourname', repo: 'yourrepo', number: 123, body: 'Hello World!}
    const params = context.issue({body: config.body})

    // Post a comment on the issue
    return context.github.issues.createComment(params)
  })
}
