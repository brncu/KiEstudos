import { z } from "zod";

/**
 * Strict schema for user profile validation
 */
export const profileSchema = z.object({
  fullName: z
    .string({ required_error: "O nome completo é obrigatório." })
    .trim()
    .min(2, "O nome deve ter no mínimo 2 caracteres.")
    .max(100, "O nome não pode exceder 100 caracteres."),
  username: z
    .string({ required_error: "O nome de usuário é obrigatório." })
    .trim()
    .min(3, "O nome de usuário deve ter no mínimo 3 caracteres.")
    .max(30, "O nome de usuário não pode exceder 30 caracteres.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e sublinhados (_)."),
  phone: z
    .string()
    .trim()
    .regex(/^$|^(\+?[0-9\s()-]{8,20})$/, "Formato de telefone inválido.")
    .optional(),
  phoneInput: z
    .string()
    .trim()
    .regex(/^$|^(\+?[0-9\s()-]{8,20})$/, "Formato de telefone inválido.")
    .optional(),
  targetRole: z
    .string({ required_error: "O cargo/concurso alvo é obrigatório." })
    .trim()
    .min(2, "Informe seu cargo ou concurso alvo.")
    .max(120, "O cargo não pode exceder 120 caracteres."),
  dailyHours: z.coerce
    .number({ invalid_type_error: "Informe um número válido de horas." })
    .min(0.5, "Meta diária mínima de 0.5 hora.")
    .max(18, "Meta diária não pode exceder 18 horas."),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileFormData = ProfileInput;
