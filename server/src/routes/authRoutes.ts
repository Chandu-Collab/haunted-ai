
import { Router } from 'express'
import { signup, login, updateAvatar, updateNickname, updatePersonalRituals, getPersonalRituals } from '../controllers/authController'

const router = Router()

// Personal rituals (greeting/goodbye)
router.post('/rituals', updatePersonalRituals)
router.get('/rituals', getPersonalRituals)




// Avatar upload/update
router.post('/avatar', updateAvatar)

router.post('/nickname', updateNickname)

export default router
