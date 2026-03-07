import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { hashPassword, verifyPassword } from "./password";

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [
        Password({
            crypto: {
                hashSecret: hashPassword,
                verifySecret: verifyPassword,
            },
        }),
        Google(),
    ],
});
