const getConfig = require('probot-config')
const {reportError} = require('./report-error')

module.exports = (robot) => {
  robot.log('Yay, the app was loaded!')

  robot.on('issues.opened', async context => {
    robot.log('Got opened issue!')

    let config

    try {
      config = await getConfig(context, 'welcome.yml')
    } catch (error) {
      return reportError(context, 'readConfig', {errorName: error.name, errorMessage: error.message})
    }

    const params = context.issue({body: config.welcome})

    // Post a comment on the issue
    try {
      await context.github.issues.createComment(params)
    } catch (error) {
      return reportError(context, 'createComment', {errorMessage: error.message})
    }
  })
}
