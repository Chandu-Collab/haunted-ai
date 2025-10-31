import { Router } from 'express'
import { signup, login, updateAvatar, updateNickname } from '../controllers/authController'

const router = Router()




// Avatar upload/update
router.post('/avatar', updateAvatar)

router.post('/nickname', updateNickname)

export default router
