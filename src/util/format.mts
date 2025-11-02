import type { ZodError } from "zod";

const formatValidationError = (errors: ZodError): string => {
  if (!errors || !errors.issues) {
    return "Validation failed";
  }
  if (Array.isArray(errors.issues)) {
    return errors.issues.map(v => v.message).join(", ");
  }
  return JSON.stringify(errors);
};

export default formatValidationError;
