import { Password } from "@convex-dev/auth/providers/Password";
 
export default {
  providers: [
    Password({
      client: {
        signUp: {
          name: {
            required: false,
          },
        },
      },
    }),
  ],
};
