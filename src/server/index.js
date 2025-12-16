import { catchAll } from '~/src/server/common/helpers/errors.js'
import { config } from '~/src/config/config.js'
import crumb from '@hapi/crumb'
import { getCacheEngine } from '~/src/server/common/helpers/session-cache/cache-engine.js'
import hapi from '@hapi/hapi'
import { join } from 'node:path'
import { nunjucksConfig } from '~/src/config/nunjucks/nunjucks.js'
import path from 'path'
import plugin from '@defra/forms-engine-plugin'
import { pulse } from '~/src/server/common/helpers/pulse.js'
import { requestLogger } from '~/src/server/common/helpers/logging/request-logger.js'
import { requestTracing } from '~/src/server/common/helpers/request-tracing.js'
import { router } from './router.js'
import { secureContext } from '~/src/server/common/helpers/secure-context/index.js'
import services from '~/src/server/forms-service.js'
import { sessionCache } from '~/src/server/common/helpers/session-cache/session-cache.js'
import { setupProxy } from '~/src/server/common/helpers/proxy/setup-proxy.js'

export const paths = [join(config.get('appDir'), 'views')]

export async function createServer() {
  setupProxy()
  const server = hapi.server({
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(
          /** @type {Engine} */ (config.get('session.cache.engine'))
        )
      }
    ],
    state: {
      strictHeader: false
    }
  })
  await server.register([
    crumb,
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    router // Register all the controllers/routes defined in src/server/router.js
  ])

  const options = {
    services,
    nunjucks: {
      baseLayoutPath: 'layout.html',
      paths: [...paths, 'node_modules/govuk-frontend/dist']
    },
    viewContext: nunjucksConfig.options.context,
    baseUrl: 'http://localhost:3000/',
    cache: 'session'
  }
  // Register the forms-engine-plugin
  await server.register({ plugin, options })

  server.ext('onPreResponse', catchAll)

  return server
}

/**
 * @import {Engine} from '~/src/server/common/helpers/session-cache/cache-engine.js'
 */
