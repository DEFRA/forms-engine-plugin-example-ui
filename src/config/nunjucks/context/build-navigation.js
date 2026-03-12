/**
 * @param {Partial<Request> | null} request
 */
export function buildNavigation(request) {
  return [
    {
      text: 'Home',
      url: '/',
      isActive: request?.path === '/'
    },
    {
      text: 'Simple form',
      url: '/simple-form/start',
      isActive: request?.path?.startsWith('/simple-form')
    },
    {
      text: 'Register a unicorn form',
      url: '/register-a-unicorn/where-do-you-live',
      isActive: request?.path?.startsWith('/register-a-unicorn')
    }
  ]
}

/**
 * @import { Request } from '@hapi/hapi'
 */
