import { fields as meetups } from './meetups'
import { fields as mentors } from './mentors'
import { fields as passwordReset } from './passwordReset'
import { fields as timeSlots } from './timeSlots'
import { fields as users } from './users'
import { fields as profilePictures } from './profilePictures'

const models: any = {
  meetups,
  mentors,
  passwordReset,
  timeSlots,
  users,
  profilePictures,
}

export function get(name: string) {
  if (Object.keys(models).includes(name)) {
    return models[name]
  }
}
