const mongoose = require('mongoose')
const marked = require('marked')
const slugify = require('slugify')
const createDomPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const dompurify = createDomPurify(new JSDOM().window)

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  profilepic: {
    type: String,
    required: true,
    default: "/icons/default.png"
  },
  password: {
      type: String,
      required: true
  },
  likedposts: {
      type: Array,
      required: true,
      default: ["none", "none2"]
  },
  admin: {
      type: Boolean,
      required: true,
      default: false
  },
})

userSchema.pre('validate', function(next) {
  next()
})

module.exports = mongoose.model('Users', userSchema)