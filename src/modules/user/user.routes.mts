import { Router } from "express";

import { userController } from "./user.controller.mjs";
import { createUserDtoSchema } from "./dtos/create-user.dto.mjs";
import { updateUserDtoSchema } from "./dtos/update-user.dto.mjs";
import { validateDto } from "@middlewares";

const router = Router();

// All user routes are protected
// router.use(authMiddleware);

router
  .route("/user")
  .get(userController.getAllUsers)
  .post(validateDto(createUserDtoSchema), userController.createUser);

router
  .route("/user/:id")
  .get(userController.getUserById)
  .patch(validateDto(updateUserDtoSchema), userController.updateUser)
  .delete(userController.deleteUser);

export const userRoutes = router;
