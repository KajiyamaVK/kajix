"use client";

// import { useState, useEffect } from "react";
// import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { ThemeToggle } from "../theme/theme-toggle";
import { LanguageToggle } from "../i18n/language-toggle";
import { useTranslation } from "@/app/i18n/client";

export default function LoginPage() {
  const { t } = useTranslation();
  // const [mounted, setMounted] = useState(false);
  // const { theme } = useTheme();

  // TODO: Remove this part if no hydration errors appears. Commenting on March 7, 2025.
  // Prevent hydration mismatch
  // useEffect(() => {
  //   setMounted(true)
  // }, [])

  // if (!mounted) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary">Kajix</h1>
          <p className="text-muted-foreground">{t("welcome")}</p>
        </div>

        <Card className="rounded-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t("accountAccess")}</CardTitle>
            <CardDescription>{t("signInToAccount")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t("login")}</TabsTrigger>
                <TabsTrigger value="register">{t("register")}</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <span>{t("poweredBy")} </span>
              <a
                href="https://kajix.com"
                className="underline underline-offset-4 hover:text-primary"
              >
                Kajix
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
