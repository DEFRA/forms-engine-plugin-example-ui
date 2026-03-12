import Boom from '@hapi/boom'
import services from '~/src/server/forms-service.js'

const { formsService } = services

const VALID_ID = '48158770-647d-4fde-a3c5-1fc1e28f780d'
const VALID_SLUG = 'example-form'

describe('formsService', () => {
  describe('getFormMetadata', () => {
    test('returns metadata for known slug', async () => {
      const result = await formsService.getFormMetadata(VALID_SLUG)
      expect(result.id).toBe(VALID_ID)
      expect(result.slug).toBe(VALID_SLUG)
    })

    test('throws Boom.notFound for unknown slug', async () => {
      await expect(formsService.getFormMetadata('unknown')).rejects.toThrow(
        Boom.notFound().message
      )
    })
  })

  describe('getFormMetadataById', () => {
    test('returns metadata for known id', async () => {
      const result = await formsService.getFormMetadataById(VALID_ID)
      expect(result.id).toBe(VALID_ID)
    })

    test('throws Boom.notFound for unknown id', async () => {
      await expect(
        formsService.getFormMetadataById('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(Boom.notFound().message)
    })
  })

  describe('getFormDefinition', () => {
    test('returns definition for known id', async () => {
      const result = await formsService.getFormDefinition(VALID_ID)
      expect(result.engine).toBe('V2')
      expect(result.pages.length).toBeGreaterThan(0)
    })

    test('ignores state parameter and still returns definition', async () => {
      const result = await formsService.getFormDefinition(VALID_ID, 'live')
      expect(result.engine).toBe('V2')
    })

    test('throws Boom.notFound for unknown id', async () => {
      await expect(
        formsService.getFormDefinition('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(Boom.notFound().message)
    })
  })

  describe('getFormSecret', () => {
    test('throws Boom.notFound always', async () => {
      await expect(
        formsService.getFormSecret(VALID_ID, 'some-secret')
      ).rejects.toThrow(Boom.notFound().message)
    })
  })
})
