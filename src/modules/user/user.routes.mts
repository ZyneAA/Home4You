import { validateDto } from "@middlewares";
import { Router } from "express";

import { updateUserDtoSchema } from "./dtos/update-user.dto.mjs";
import { userController } from "./user.controller.mjs";

const router = Router();

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(validateDto(updateUserDtoSchema), userController.updateUser)
  .delete(userController.deleteUser);

export const userRoutes = router;
