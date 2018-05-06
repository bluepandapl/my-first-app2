const { reportError, replaceInString } = require('../report-error')

const getConfig = require('probot-config')
jest.mock('probot-config', () => jest.fn().mockImplementation(() => ({
  readConfig: {
    title: 'My Title',
    body: 'Error message: {{errorMessage}}'
  }
})))

function mockContext () {
  return {
    repo (params) {
      return Object.assign({ owner: 'owner', repo: 'repo' }, params)
    },
    github: {
      issues: {
        getForRepo: jest.fn(),
        create: jest.fn()
      },
      hasNextPage: jest.fn(),
      getNextPage: jest.fn()
    }
  }
}

describe('reportError', () => {
  test('it successfully reports an error', async () => {
    const context = mockContext()
    context.github.issues.getForRepo.mockImplementation(() => ({data: []}))
    context.github.hasNextPage.mockImplementation(() => false)

    await reportError(context, 'readConfig', {errorMessage: 'bad indentation'})

    expect(getConfig).toBeCalledWith(context, 'report-error.yml')
    expect(context.github.issues.create).toBeCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: 'My Title',
      body: 'Error message: bad indentation'
    })
  })

  test('it uses the default title/body if missing config key', async () => {
    const context = mockContext()
    context.github.issues.getForRepo.mockImplementation(() => ({data: []}))
    context.github.hasNextPage.mockImplementation(() => false)

    await reportError(context, 'missingKey')

    expect(getConfig).toBeCalledWith(context, 'report-error.yml')
    expect(context.github.issues.create).toBeCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: 'Uncaught error in probot application',
      body: 'Something went wrong in your probot application. Please check the logs to resolve this issue.'
    })
  })

  test('it skips reporting if an issue already exists', async () => {
    const context = mockContext()
    context.github.issues.getForRepo.mockImplementation(() => ({
      data: [{
        title: 'My Title'
      }]
    }))
    context.github.hasNextPage.mockImplementation(() => false)

    await reportError(context, 'readConfig', {errorMessage: 'bad indentation'})

    expect(getConfig).toBeCalledWith(context, 'report-error.yml')
    expect(context.github.issues.create).not.toHaveBeenCalled()
  })
})

describe('replaceInString', () => {
  test('it replaces placeholders', () => {
    const data = {
      errorName: 'YAMLException',
      errorMessage: 'bad indentation'
    }

    const str = 'Name: {{errorName}}, Message: {{errorMessage}}';

    expect(replaceInString(str, data)).toBe('Name: YAMLException, Message: bad indentation')
  })

  test('it returns the original string with empty data', () => {
    const str = 'My String'
    expect(replaceInString(str, null)).toBe('My String')
  })
})
