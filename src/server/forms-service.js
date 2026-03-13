import Boom from '@hapi/boom'

import simpleFormDefinition from './forms/simple-form.json' with { type: 'json' }
import unicornDefinition from './forms/register-a-unicorn.json' with { type: 'json' }

/**
 * @import { FormStatus } from '@defra/forms-engine-plugin/types'
 */

// Form metadata
const now = new Date()
const user = { id: 'example-user', displayName: 'Example user' }

const author = {
  createdAt: now,
  createdBy: user,
  updatedAt: now,
  updatedBy: user
}

// Simple form
const simpleFormMetadata = {
  id: '48158770-647d-4fde-a3c5-1fc1e28f780d',
  slug: 'simple-form',
  title: 'Simple form',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Register a unicorn form
const unicornMetadata = {
  id: 'b2e7c8a1-3f4d-4e5b-9c6d-7a8b9c0d1e2f',
  slug: 'register-a-unicorn',
  title: 'Register a unicorn',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

const formsService = {
  getFormMetadata: function (slug) {
    switch (slug) {
      case simpleFormMetadata.slug:
        return Promise.resolve(simpleFormMetadata)
      case unicornMetadata.slug:
        return Promise.resolve(unicornMetadata)
      default:
        return Promise.reject(Boom.notFound())
    }
  },
  getFormMetadataById: function (id) {
    switch (id) {
      case simpleFormMetadata.id:
        return Promise.resolve(simpleFormMetadata)
      case unicornMetadata.id:
        return Promise.resolve(unicornMetadata)
      default:
        return Promise.reject(Boom.notFound())
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFormDefinition: function (id, /** @type {FormStatus} */ _state) {
    switch (id) {
      case simpleFormMetadata.id:
        return Promise.resolve(simpleFormDefinition)
      case unicornMetadata.id:
        return Promise.resolve(unicornDefinition)
      default:
        return Promise.reject(Boom.notFound())
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFormSecret: function (_formId, _secretName) {
    return Promise.reject(Boom.notFound())
  }
}

const formSubmissionService = {
  persistFiles: () => Promise.resolve({}),
  submit: () =>
    Promise.resolve({
      message: 'OK',
      result: { files: { main: '', repeaters: {} } }
    })
}

const outputService = {
  submit: () => Promise.resolve()
}

export default { formsService, formSubmissionService, outputService }
