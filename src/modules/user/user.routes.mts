import { Router } from "express";

import { userController } from "./user.controller.mjs";
// import { createUserDtoSchema } from "./dtos/create-user.dto.mjs";
// import { updateUserDtoSchema } from "./dtos/update-user.dto.mjs";

const router = Router();

// All user routes are protected
// router.use(authMiddleware);

router.route("/").get(userController.getAllUsers);
// .post(validateDto(createUserDtoSchema), userController.createUser);

router
  .route("/:id")
  .get(userController.getUserById)
  // .patch(validateDto(updateUserDtoSchema), userController.updateUser)
  .delete(userController.deleteUser);

export const userRoutes = router;
