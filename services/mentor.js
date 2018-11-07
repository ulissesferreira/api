const crypto = require('crypto')

class Mentor {

  constructor(app) {
    this.database = app.get('db').getPool()
    this.logger = app.get('logger')

    if(this.logger) this.logger.verbose('Mentor service loaded')
  }

  async get(req, res) {
    let sql = 'SELECT name, role, company, location, tags, bio, freeSlots, profilePic, twitter, linkedin, github, facebook, dribbble, favoritePlaces FROM users WHERE keycode = ? AND type = "mentor"',
      response = {
        ok: 1,
        code: 200
      }
    
    try {
      let [rows] = await this.database.query(sql, [req.params.keycode])
      if(!rows.length) throw 404

      response.mentor = rows[0]
    } catch (err) {
      response.ok = 0
      response.code = 400

      if(err === 404) {
        response.code = err
        response.message = 'Mentor not found'
      }

    }

    res.status(response.code).json(response)
  }

  async getRandom(req, res) {
    let sql = 'SELECT name, role, company, bio, tags, keycode, profilePic FROM users ORDER BY RAND() LIMIT 5',
      response = {
        ok: 1,
        code: 200
      }

    try {
      let [rows] = await this.database.query(sql)
      if(!rows.length) throw 404

      response.mentor = shuffle(rows)
    } catch (err) {
      response.ok = 0
      response.code = 400

      if(err === 404) {
        response.code = err
      }
    }

    res.status(response.code).json(response)
  }

  /**
   * @description Returns mentor's time slots
   * @param {Request} req 
   * @param {Response} res 
   */
  async getTimeSlots(req, res) {
    let response = {
      ok: 1,
      code: 200
    }

    try {
      let startDate = req.query.start,
        endDate = req.query.end,
        sqlQuery = 'SELECT * FROM timeSlots WHERE mentorUID = ?'

      /** 
       * if startDate and endDate is not set,
       *  return all future time slots
       */
      if(!startDate && !endDate) {
        sqlQuery += ' AND start >= NOW()'
      }
      
      /**
       * set starting and ending date/time
       */
      if(startDate) sqlQuery += ` AND start >= TIMESTAMP("${startDate}")`
      if(endDate) sqlQuery += ` AND start <= TIMESTAMP("${endDate}")`

      let [slots] = await this.database.query(sqlQuery, [req.jwt.uid]) 
      if(!slots.length) throw { APIerr: true, errorCode: 404, errorMessage: 'Slots not found' }
      
      response.slots = slots
    } catch (err) {
      response.ok = 0
      response.code = 400

      if(err.APIerr) {
        response.code = err.errorCode
        response.message = err.errorMessage
      }
    }
    
    res.status(response.code).json(response)
  }

  /**
   * @description Updates and creates mentor's time slots
   * @param {Request} req 
   * @param {Response} res 
   */
  async updateTimeSlots(req, res) {
    let deletedSlots = req.body.deleted,
      updatedSlots = req.body.updated,
      sqlQuery = '',
      response = {
        ok: 1,
        code: 200
      }
    
    // delete events
    if(deletedSlots) {
      sqlQuery = 'SELECT deleteSlot(?, ?)'
      response.deleteOK = 1

      for (let slotID of deletedSlots) {
        try {
          await this.database.query(sqlQuery, [slotID, req.jwt.uid])

        } catch (err) {
          response.ok = 0
          response.code = 400
          response.message = 'One or more time slots couldn\'t be deleted'
          response.deleteOK = 0
        }
      }
    }
    
    // try to update events
    if(updatedSlots) {
      sqlQuery = 'SELECT insertUpdateSlot(?, ?, ?, ?, ?)'
      response.updateOK = 1

      for (let slot of updatedSlots) {
        try {
          if(!slot.sid) slot.sid = crypto.randomBytes(20).toString('hex')

          /** let's figure out if the slot is +1h
           *  so we can divide it into multiple slots
           */
          let hourDiff = Math.floor(Math.abs((new Date(slot.end) - new Date(slot.start)) / 3.6e6))
          if(hourDiff > 1) {
            // iterator
            let slotStart = new Date(slot.start)
            while(hourDiff--) {
              updatedSlots.push({
                start: slotStart,
                end: new Date(new Date(slotStart).setHours(new Date(slotStart).getHours() + 1)),
                recurrency: slot.recurrency
              })
              
              // next event starts at the end of the previous one
              slotStart = new Date(new Date(slotStart).setHours(new Date(slotStart).getHours() + 1))
            }
            continue;
          } else {
            await this.database.query(sqlQuery, [slot.sid, req.jwt.uid, slot.start, slot.end, slot.recurrency])
          }
        } catch (err) {
          response.ok = 0
          response.code = 400
          response.message = 'One or more time slots couldn\'t be updated'
          response.updateOK = 0
        }
      }
    }

    res.status(response.code).json(response)
  }

  async verify(req, res) {
    let check = req.query.keycode ? 'keycode' : 'uniqueid'
    let value = req.query.keycode ? '"' + req.query.keycode + '"' : req.query.uniqueid
    let sql = `SELECT * FROM onboarding WHERE ${check} = ${value}` 
    let response = {
      ok: 1,
      code: 200
    }
    try {
      let [rows] = await this.database.query(sql)
      if(!rows.length) throw 404

      response.name = rows[0].name
    } catch (err) {
      response.ok = 0
      response.code = 400
    }
    res.status(response.code).json(response)
  }

}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a.slice(0, 2);
}

module.exports = Mentor
