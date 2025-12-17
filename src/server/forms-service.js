import { FileFormService } from '@defra/forms-engine-plugin/file-form-service.js'

// Create shared form metadata
const now = new Date()
const user = { id: 'user', displayName: 'Username' }
const author = {
  createdAt: now,
  createdBy: user,
  updatedAt: now,
  updatedBy: user
}

const metadata = {
  organisation: 'Defra',
  teamName: 'Team name',
  teamEmail: 'team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'email@domain.com',
  ...author,
  live: author
}

const loader = new FileFormService()

await loader.addForm('/tmp/services/components.json', {
  ...metadata,
  id: '95e92559-968d-44ae-8666-2b1ad3dffd31',
  title: 'Example all components',
  slug: 'components'
})

await loader.addForm('/tmp/services/test.json', {
  ...metadata,
  id: '641aeafd-13dd-40fa-9186-001703800efb',
  title: 'Example test',
  slug: 'test'
})

await loader.addForm('/tmp/services/demo.json', {
  ...metadata,
  id: '82aedd04-3e12-43f1-855e-a5034bea28db',
  title: 'Example demo',
  slug: 'demo'
})

const formsService = loader.toFormsService()

export default { formsService }
