import Boom from '@hapi/boom'
import { createLogger } from '~/src/server/common/helpers/logging/logger.js'
import fs from 'fs'

// Form metadata
const now = new Date()
const user = { id: 'example-user', displayName: 'Example user' }

const author = {
  createdAt: now,
  createdBy: user,
  updatedAt: now,
  updatedBy: user
}

const metadata = {
  id: '48158770-647d-4fde-a3c5-1fc1e28f780d',
  slug: 'example-form',
  title: 'Example form',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

const definition = {
  engine: 'V2',
  name: 'Example form',
  pages: [
    {
      title: 'Start page',
      path: '/start',
      controller: 'StartPageController',
      components: [
        {
          name: 'Jhimsh',
          title: 'Html',
          type: 'Html',
          content: '<p class="govuk-body">Example</p>',
          options: {},
          schema: {}
        }
      ]
    },
    {
      path: '/full-name',
      title: 'Enter your full name',
      components: [
        {
          name: 'sdrGvs',
          title: 'Full name',
          type: 'TextField',
          options: {},
          schema: {}
        }
      ]
    },
    {
      path: '/summary',
      title: 'Check your answers',
      controller: 'SummaryPageController'
    }
  ],
  lists: [],
  sections: [],
  conditions: []
}

const formsService = {
  getFormMetadata: function (slug) {
    try {
      const logger = createLogger()

      logger.info('My slug: ' + slug)

      switch (slug) {
        case metadata.slug:
          return Promise.resolve(metadata)
        default:
          // eslint-disable-next-line no-case-declarations
          const metadata2 = {
            id: '449c053b-9201-4312-9a75-187ac1b71111',
            slug: 'test',
            title: 'Example form 1111',
            organisation: 'Defra',
            teamName: 'Example team',
            teamEmail: 'example-team@defra.gov.uk',
            submissionGuidance: "Thanks for your submission, we'll be in touch",
            notificationEmail: 'example-email-submission-recipient@defra.com',
            ...author,
            live: author
          }
          return Promise.resolve(metadata2)
      }
    } catch (e) {
      throw Boom.notFound(`Form '${JSON.stringify(e)}' not found`)
    }
  },
  getFormDefinition: function (id) {
    const logger = createLogger()

    logger.info('My id: ' + id)
    switch (id) {
      case metadata.id:
        return Promise.resolve(definition)
      case '449c053b-9201-4312-9a75-187ac1b71111':
        logger.info('Get from file')

        // eslint-disable-next-line no-case-declarations
        const fileValue = fs.readFileSync(`/tmp/services/test.json`, 'utf8')

        logger.info('File value: ' + fileValue)
        // eslint-disable-next-line no-case-declarations
        const result = JSON.parse(fileValue)

        return Promise.resolve(result)
      default:
        throw Boom.notFound(`Form '${id}' not found`)
    }
  }
}

export default { formsService }
