import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { PRESET_THEMES } from "@/lib/themes";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeSettings() {
  const { mode, setMode, colorTheme, setColorTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Modo</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', icon: Sun, label: 'Claro' },
                { value: 'dark', icon: Moon, label: 'Escuro' },
                { value: 'system', icon: Monitor, label: 'Sistema' }
              ].map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    variant={mode === value ? 'default' : 'outline'}
                    onClick={() => setMode(value as 'light' | 'dark' | 'system')}
                    asChild
                    className="h-auto py-6"
                  >
                   <motion.button 
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center justify-center gap-2"
                   >
                    <Icon className="h-6 w-6" />
                    <span>{label}</span>
                   </motion.button>
                  </Button>
              ))}
            </div>
          </div>

          {/* Color Theme Selection */}
          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema de Cor</label>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {PRESET_THEMES.map((theme, index) => {
                  const isActive = colorTheme === theme.id;
                  const colorStyle = `rgb(${theme.primary})`;
                  
                  return (
                    <motion.button
                      key={theme.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setColorTheme(theme.id)}
                      className={`
                        relative group flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors
                        ${isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      <motion.div 
                        className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: colorStyle }}
                        animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                      >
                         {isActive && <Check className="h-5 w-5" />}
                      </motion.div>
                      <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                        {theme.name}
                      </span>
                    </motion.button>
                  );
                })}
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
