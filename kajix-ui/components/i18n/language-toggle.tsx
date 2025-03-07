"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/app/i18n/client"

export function LanguageToggle() {
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)

  const languages = [
    { code: "en", name: "English (US)" },
    { code: "pt-BR", name: "Português (Brasil)" },
  ]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setOpen(false)

    // You might want to update the URL or store the language preference
    // This is a simplified example
    localStorage.setItem("language", lng)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title={t("changeLanguage")}>
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("changeLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)} className="cursor-pointer">
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

