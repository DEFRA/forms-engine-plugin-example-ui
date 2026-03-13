import { buildNavigation } from '~/src/config/nunjucks/context/build-navigation.js'

/**
 * @param {Partial<Request>} [options]
 */
function mockRequest(options) {
  return { ...options }
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
      {
        active: false,
        text: 'Simple form',
        href: '/simple-form/start'
      },
      {
        active: false,
        text: 'Register a unicorn form',
        href: '/register-a-unicorn/where-do-you-live'
      }
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/simple-form/start' }))
    ).toEqual([
      {
        active: true,
        text: 'Simple form',
        href: '/simple-form/start'
      },
      {
        active: false,
        text: 'Register a unicorn form',
        href: '/register-a-unicorn/where-do-you-live'
      }
    ])
  })
})

/**
 * @import { Request } from '@hapi/hapi'
 */
