import { z } from "zod";

/**
 * Schema for user sign in (Login)
 */
export const signInSchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Insira um endereço de e-mail válido.")
    .max(255, "O e-mail não pode ter mais de 255 caracteres."),
  password: z
    .string({ required_error: "A senha é obrigatória." })
    .min(6, "A senha deve conter no mínimo 6 caracteres.")
    .max(72, "A senha não pode exceder 72 caracteres."),
});

/**
 * Schema for user sign up (Registration)
 */
export const signUpSchema = z
  .object({
    fullName: z
      .string({ required_error: "O nome completo é obrigatório." })
      .trim()
      .min(2, "O nome deve ter no mínimo 2 caracteres.")
      .max(100, "O nome não pode exceder 100 caracteres."),
    email: z
      .string({ required_error: "O e-mail é obrigatório." })
      .trim()
      .min(1, "O e-mail é obrigatório.")
      .email("Insira um endereço de e-mail válido.")
      .max(255, "O e-mail não pode ter mais de 255 caracteres."),
    password: z
      .string({ required_error: "A senha é obrigatória." })
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .max(72, "A senha não pode exceder 72 caracteres.")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número."),
    confirmPassword: z
      .string({ required_error: "A confirmação de senha é obrigatória." })
      .min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

/**
 * Schema for password recovery request
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .min(1, "O e-mail é obrigatório.")
    .email("Insira um endereço de e-mail válido.")
    .max(255, "O e-mail não pode ter mais de 255 caracteres."),
});

// Aliases for compatibility
export const loginSchema = signInSchema;
export const signupSchema = signUpSchema;

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export type LoginFormData = SignInInput;
export type SignupFormData = SignUpInput;
export type ForgotPasswordFormData = ForgotPasswordInput;
