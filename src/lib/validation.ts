export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const checkPasswordStrength = (password: string): { score: number; feedback: string[] } => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push("Password must be at least 8 characters long");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Include at least one uppercase letter");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("Include at least one lowercase letter");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("Include at least one number");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("Include at least one special character");

    return { score, feedback };
};

export const sanitizeInput = (input: string): string => {
    return input.replace(/[<>]/g, "");
};

export interface ProductData {
    name: string;
    price: number;
    quantity: number;
    description: string;
}

export const validateProductData = (data: ProductData): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!data.name || data.name.trim().length < 3) {
        errors.name = "Product name must be at least 3 characters";
    }

    if (data.price < 0) {
        errors.price = "Price cannot be negative";
    }

    if (data.quantity < 0) {
        errors.quantity = "Quantity cannot be negative";
    }

    if (!data.description || data.description.trim().length < 10) {
        errors.description = "Description must be at least 10 characters";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
