class Mentor {

  constructor(app) {
    this.database = app.get('db').getPool()
    this.logger = app.get('logger')

    if(this.logger) this.logger.verbose('Mentor service loaded')
  }

  async get(req, res) {
    if(req.params.keycode === 'random') {
      this.getRandom(req, res)
      return;
    }

    let sql = 'SELECT name, role, company, location, tags, bio, freeSlots, profilePic, twitter, linkedin, github, facebook, dribbble, favoritePlaces FROM users WHERE keycode = ?',
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

  async verify(req, res) {
    let check = req.query.keycode ? 'keycode' : 'uniqueid'
    let value = req.query.keycode ? '\"' + req.query.keycode + '\"' : req.query.uniqueid
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
