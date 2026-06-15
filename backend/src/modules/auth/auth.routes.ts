import { Router } from 'express';
import { validateResource } from '../../middleware/validateResource.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../../schemas/auth.schema.js';
import { registerController, loginController, refreshController, logoutController } from './auth.controller.js';

const router = Router();

router.post('/register', validateResource(registerSchema), registerController);
router.post('/login', validateResource(loginSchema), loginController);
router.post('/refresh', validateResource(refreshSchema), refreshController);
router.post('/logout', validateResource(logoutSchema), logoutController);

export default router;
