import { protect, validateDto } from "@middlewares";
import { Router } from "express";

import { updateUserDtoSchema } from "./dtos/update-user.dto.mjs";
import { userController } from "./user.controller.mjs";

const router = Router();

router
  .route("/:id")
  .get(protect, userController.getUserById)
  .patch(protect, validateDto(updateUserDtoSchema), userController.updateUser)
  .delete(protect, userController.deleteUser);

export const userRoutes = router;
