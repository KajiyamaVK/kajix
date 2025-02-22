import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LoginFormData,
  RegisterFormData,
  loginSchema,
  registerSchema,
} from "@/components/auth/auth.schema"
import { useState } from "react"

export const LoginForm = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onLoginSubmit = (data: LoginFormData) => {
    console.log("Login data:", data)
    // TODO: Implement login logic
  }

  const onRegisterSubmit = (data: RegisterFormData) => {
    console.log("Register data:", data)
    // TODO: Implement register logic
  }

  return (
    <Tabs 
      defaultValue="login" 
      className="w-full"
      onValueChange={(value) => setActiveTab(value as "login" | "register")}
    >
      <TabsList className="grid w-full grid-cols-2" aria-label={t('auth.chooseAuthMethod')}>
        <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
        <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <form 
          onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
          className="space-y-4"
          aria-label={t('auth.loginForm')}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              aria-describedby="email-description email-error"
              aria-invalid={!!loginForm.formState.errors.email}
              {...loginForm.register("email")}
            />
            <span className="sr-only" id="email-description">
              {t('auth.emailDescription')}
            </span>
            {loginForm.formState.errors.email && (
              <p 
                className="text-sm text-red-500" 
                id="email-error"
                role="alert"
              >
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              aria-describedby="password-description password-error"
              aria-invalid={!!loginForm.formState.errors.password}
              {...loginForm.register("password")}
            />
            <span className="sr-only" id="password-description">
              {t('auth.passwordDescription')}
            </span>
            {loginForm.formState.errors.password && (
              <p 
                className="text-sm text-red-500" 
                id="password-error"
                role="alert"
              >
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            {activeTab === "login" ? t('auth.signIn') : t('auth.signUp')}
          </Button>

        </form>
      </TabsContent>

      <TabsContent value="register">
        <form 
          onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
          className="space-y-4"
          aria-label={t('auth.registerForm')}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.name')}</Label>
            <Input
              id="name"
              type="text"
              aria-describedby="name-description name-error"
              aria-invalid={!!registerForm.formState.errors.name}
              {...registerForm.register("name")}
            />
            <span className="sr-only" id="name-description">
              {t('auth.nameDescription')}
            </span>
            {registerForm.formState.errors.name && (
              <p 
                className="text-sm text-red-500" 
                id="name-error"
                role="alert"
              >
                {registerForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">{t('auth.email')}</Label>
            <Input
              id="register-email"
              type="email"
              aria-describedby="register-email-description register-email-error"
              aria-invalid={!!registerForm.formState.errors.email}
              {...registerForm.register("email")}
            />
            <span className="sr-only" id="register-email-description">
              {t('auth.emailDescription')}
            </span>
            {registerForm.formState.errors.email && (
              <p 
                className="text-sm text-red-500" 
                id="register-email-error"
                role="alert"
              >
                {registerForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">{t('auth.password')}</Label>
            <Input
              id="register-password"
              type="password"
              aria-describedby="register-password-description register-password-error"
              aria-invalid={!!registerForm.formState.errors.password}
              {...registerForm.register("password")}
            />
            <span className="sr-only" id="register-password-description">
              {t('auth.passwordDescription')}
            </span>
            {registerForm.formState.errors.password && (
              <p 
                className="text-sm text-red-500" 
                id="register-password-error"
                role="alert"
              >
                {registerForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
            <Input
              id="confirm-password"
              type="password"
              aria-describedby="confirm-password-description confirm-password-error"
              aria-invalid={!!registerForm.formState.errors.confirmPassword}
              {...registerForm.register("confirmPassword")}
            />
            <span className="sr-only" id="confirm-password-description">
              {t('auth.confirmPasswordDescription')}
            </span>
            {registerForm.formState.errors.confirmPassword && (
              <p 
                className="text-sm text-red-500" 
                id="confirm-password-error"
                role="alert"
              >
                {registerForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            {activeTab === "login" ? t('auth.signIn') : t('auth.signUp')}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
} 