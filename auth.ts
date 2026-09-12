import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./src/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { SUPER_ADMIN_EMAILS, getRolePermissions, resolveOrCreateFirestoreUser } from "./server/auth";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi.");
        }
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error("Email atau password salah.");
          }

          let userData: any = null;
          let userDocId = "";
          querySnapshot.forEach((docSnap) => {
            userData = docSnap.data();
            userDocId = docSnap.id;
          });

          if (!userData || !userData.passwordHash) {
            throw new Error("Akun ini terdaftar via Google. Silakan login menggunakan Google.");
          }

          const isValid = await bcrypt.compare(password, userData.passwordHash);
          if (!isValid) {
            throw new Error("Email atau password salah.");
          }

          await setDoc(doc(db, "users", userDocId), {
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });

          const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
          const role = isSuperAdmin ? "SUPER_ADMIN" : (userData.role || "USER");

          return {
            id: userDocId,
            email: userData.email,
            name: userData.name || email.split("@")[0],
            image: userData.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || email)}&background=0D8ABC&color=fff`,
            role,
            permissions: getRolePermissions(role)
          };
        } catch (error: any) {
          console.error("[Credentials Authorize Error]:", error);
          throw new Error(error.message || "Autentikasi gagal.");
        }
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt" as const,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === "google" && user?.email) {
        await resolveOrCreateFirestoreUser(
          user.email,
          user.name || user.email.split("@")[0],
          user.image
        );
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role;
        token.permissions = user.permissions;
      } else if (token?.email) {
        const normalizedEmail = token.email.toLowerCase().trim();
        const userId = `usr_${Buffer.from(normalizedEmail).toString('hex').slice(0, 10)}`;
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            token.role = data.role || (SUPER_ADMIN_EMAILS.includes(normalizedEmail) ? "SUPER_ADMIN" : "USER");
            token.permissions = getRolePermissions(token.role);
          }
        } catch (e) {
          // ignore
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id || token.sub;
        session.user.role = token.role || "USER";
        session.user.permissions = token.permissions || ["apps.read"];
        session.user.image = token.image || session.user.image;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
