const express = require('express')
const router = express.Router()
const db = require('../services/db.js')
const verifyToken = require('../services/token.js')
// File upload
const formidable = require('formidable')
const AWS = require('aws-sdk')

router.get('/me', verifyToken, (req, res) => {
  let sql = 'SELECT * FROM users WHERE email = ?'
  db.query(sql, req.userEmail, (err, result) => {
    res.status(200).send(result)
  })
})

router.post('/me', verifyToken, (req, res) => {
  let email = req.body.email ? `email='${req.body.email}', ` : '' //TODO Temporary
  let password = req.body.password ? `password='${req.body.password}', ` : '' //TODO Temporary
  let name = req.body.name ? `name='${req.body.name}', ` : ''
  let role = req.body.role ? `role='${req.body.role}', ` : ''
  let company = req.body.company ? `company='${req.body.company}', ` : ''
  let location = req.body.location ? `location='${req.body.location}', ` : ''
  let tags = req.body.tags ? `tags='${req.body.tags}', ` : ''
  let bio = req.body.bio ? `bio='${req.body.bio}', ` : ''
  let freeSlots = req.body.freeSlots ? `freeSlots='${req.body.freeSlots}', ` : ''
  let profilePic = req.body.profilePic ? `profilePic='${req.body.profilePic}', ` : ''
  let twitter = req.body.twitter ? `twitter='${req.body.twitter}', ` : ''
  let linkedin = req.body.linkedin ? `linkedin='${req.body.linkedin}', ` : ''
  let github = req.body.github ? `github='${req.body.github}', ` : ''
  let facebook = req.body.facebook ? `facebook='${req.body.facebook}', ` : ''
  let dribbble = req.body.dribbble ? `dribbble='${req.body.dribbble}', ` : ''
  let favoritePlaces = req.body.favoritePlaces ? `favoritePlaces='${req.body.favoritePlaces}', ` : ''
  let googleAccessToken = req.body.googleAccessToken ? `googleAccessToken='${req.body.googleAccessToken}', ` : ''
  let googleRefreshToken = req.body.googleRefreshToken ? `googleRefreshToken='${req.body.googleRefreshToken}', ` : ''

  let sql = `UPDATE users SET ${email} ${password} ${name} ${role} ${company} ${location} ${tags} ${bio} ${freeSlots} ${profilePic} ${twitter} ${linkedin} ${github} ${facebook} ${dribbble} ${favoritePlaces} ${googleAccessToken} ${googleRefreshToken} WHERE email='${req.userEmail}'`
  
  //TODO FIx this dirty hack! Not cool but I was lazy xD
  var pos = sql.lastIndexOf(',');
  sql = sql.substring(0, pos) + '' + sql.substring(pos + 1)
  // Basically I remove the last occurence of a comma otherwise the SQL query would not work
  console.log(sql)
  db.query(sql, (err, result) => {
    if (err)
      return console.log(err)
    res.status(200).send(result)
  })
})

//router.post('/image', verifyToken, (req, res) => {
router.post('/image', (req, res) => {
  let form = new formidable.IncomingForm()
  form.parse(req)
  form.on('fileBegin', (name, file) => {
    file.path = __dirname + file.name;
  })
  form.on('file', (name, file) => {
    console.log(file)
    uploadToS3(file);
  })
  res.status(200).send('Tudo correu bem')
})

function uploadToS3 (file) {
  let s3bucket = new AWS.S3({
    accessKeyId: process.env.IAM_USER_KEY,
    secretAccessKey: process.env.IAM_USER_SECRET,
    Bucket: process.env.BUCKET_NAME
  })
  s3bucket.createBucket(function () {
    var params = {
      Bucket: process.env.BUCKET_NAME,
      Key: file.name,
      Body: file
    };
    s3bucket.upload(params, function (err, data) {
      if (err) {
        console.log('error in callback');
        console.log(err);
      }
      console.log('success');
      console.log(data);
    });
  });
}

module.exports = router;