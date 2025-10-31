import { Router } from 'express'
import { signup, login, updateAvatar, updateNickname } from '../controllers/authController'

const router = Router()



router.post('/nickname', updateNickname)

export default router
