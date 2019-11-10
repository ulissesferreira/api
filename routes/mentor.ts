import * as express from 'express'

import { mentor, auth, logger } from '../services'
import { APIrequest } from '../types'

const router: express.Router = express.Router()

function setRouters(): void {
  router.get('/all', (req: APIrequest, res: express.Response) => {
    mentor.getAll(req, res)
  })

  router.get('/random', (req: APIrequest, res: express.Response) => {
    mentor.getRandom(req, res)
  })

  router.get(
    '/slots',
    auth.verifyToken,
    auth.isMentor,
    (req: APIrequest, res: express.Response) => {
      mentor.getTimeSlots(req, res)
    }
  )

  router.post(
    '/slots',
    auth.verifyToken,
    auth.isMentor,
    (req: APIrequest, res: express.Response) => {
      mentor.updateTimeSlots(req, res)
    }
  )

  router.post('/request', (req: APIrequest, res: express.Response) => {
    mentor.request(req, res)
  })

  router.get('/verify', (req: APIrequest, res: express.Response) => {
    mentor.verify(req, res)
  })

  router.get('/:keycode', (req: APIrequest, res: express.Response) => {
    mentor.get(req, res)
  })
}

export function init(): express.Router {
  try {
    setRouters()
    logger.verbose('Mentor router loaded')
  } catch (err) {
    logger.error('Could not load mentor router')
  }

  return router
}
