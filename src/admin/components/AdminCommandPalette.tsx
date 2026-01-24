import * as React from "react"
import {
  Settings,
  User,
  LayoutDashboard,
  Shield,
  Activity,
  LogOut
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function AdminCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center w-full max-w-sm border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-sm text-slate-500 cursor-text hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors mr-4"
      >
        <span className="flex-1">Buscar...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400 opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou busca..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => runCommand(() => navigate("/admin/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/admin/users"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Usuários</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/admin/audit"))}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Auditoria</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/admin/system"))}>
              <Activity className="mr-2 h-4 w-4" />
              <span>Sistema</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Configurações">
            <CommandItem onSelect={() => runCommand(() => navigate("/admin/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Geral</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate("/admin/profile"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
           
          <CommandSeparator />

          <CommandGroup heading="Conta">
            <CommandItem 
                onSelect={() => runCommand(async () => {
                    await supabase.auth.signOut();
                    navigate("/admin/auth/login");
                })}
                className="text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </CommandItem>
          </CommandGroup>

        </CommandList>
      </CommandDialog>
    </>
  )
}
