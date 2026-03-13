/**
 * @param {Partial<Request> | null} request
 */
export function buildNavigation(request) {
  return [
    {
      text: 'Simple form',
      href: '/simple-form/start',
      active: request?.path?.startsWith('/simple-form')
    },
    {
      text: 'Register a unicorn form',
      href: '/register-a-unicorn/where-do-you-live',
      active: request?.path?.startsWith('/register-a-unicorn')
    }
  ]
}

/**
 * @import { Request } from '@hapi/hapi'
 */
