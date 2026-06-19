import { z } from "zod";

export const SignupSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
});

export const ProfileSchema = z.object({
    age: z.coerce.number().min(1, "Age must be a positive number"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    occupation: z.string().min(1, "Occupation is required"),
    familySize: z.coerce.number().min(1, "Family size must be at least 1"),
    dietType: z.enum(
        ["vegan", "vegetarian", "pescatarian", "meat-heavy"],
        {
            message: "Please select a diet type",
        }
    ),
    transportMode: z.enum(
        ["walking", "cycling", "bike", "car", "bus", "train"],
        {
            message: "Please select a transport mode",
        }
    ),
    electricityUsage: z.enum(
        ["low", "medium", "high"],
        {
            message: "Please select an electricity usage level",
        }
    ),
});

export const ActivitySchema = z.object({
    walkingDistance: z.coerce.number().min(0, "Distance cannot be negative"),
    cyclingDistance: z.coerce.number().min(0, "Distance cannot be negative"),
    bikeDistance: z.coerce.number().min(0, "Distance cannot be negative"),
    carDistance: z.coerce.number().min(0, "Distance cannot be negative"),
    busDistance: z.coerce.number().min(0, "Distance cannot be negative"),
    trainDistance: z.coerce.number().min(0, "Distance cannot be negative"),
    electricityUnits: z.coerce.number().min(0, "Electricity cannot be negative"),
    acHours: z.coerce.number().min(0, "Hours cannot be negative").max(24, "Cannot exceed 24 hours"),
    foodType: z.enum(["vegan", "vegetarian", "pescatarian", "meat-heavy"]),
    plasticUsage: z.coerce.number().min(0, "Count cannot be negative"),
    shoppingCount: z.coerce.number().min(0, "Count cannot be negative"),
});
