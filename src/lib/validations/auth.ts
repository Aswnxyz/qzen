import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Name must be 100 characters or less."),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or less."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  password: z
    .string()
    .min(1, "Please enter your password."),
});

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  otp: z
    .string()
    .regex(/^\d{6}$/, "Please enter the 6-digit verification code."),
});