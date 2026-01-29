
import * as React from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icon } from '@/components/ui/icon';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Curated list of icons relevant for a finance/lifestyle app
const ICON_NAMES = [
  // Finance & Money
  'Wallet', 'Banknote', 'CreditCard', 'PiggyBank', 'DollarSign', 'Coins', 'Briefcase',
  'TrendingUp', 'TrendingDown', 'BarChart3', 'PieChart', 'Landmark', 'Receipt',
  'Calculator', 'BadgePercent', 'Tags', 'Gem', 'Gift',
  
  // Transport
  'Car', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Fuel', 'MapPin', 'Navigation',
  
  // Home & Living
  'Home', 'Building', 'Armchair', 'Bed', 'Bath', 'Refrigerator', 'Tv', 'Wifi',
  'Plug', 'Droplets', 'Zap', 'Wrench', 'Hammer', 'Trash2',
  
  // Food & Drink
  'Utensils', 'Coffee', 'Beer', 'Wine', 'CupSoda', 'Pizza', 'Sandwich',
  'ShoppingBasket', 'ShoppingCart', 'Apple',
  
  // Health & Personal
  'Heart', 'HeartPulse', 'Stethoscope', 'Pill', 'Thermometer', 'Activity',
  'Dumbbell', 'User', 'Users', 'Baby', 'Ribbon', 'Scissors', 'Glasses', 'Shirt',
  
  // Leisure & Entertainment
  'Gamepad2', 'Music', 'Clapperboard', 'Ticket', 'Camera', 'Book', 'BookOpen',
  'GraduationCap', 'Palette', 'Tent', 'Trees', 'Sun', 'Moon', 'Umbrella',
  'Smartphone', 'Laptop', 'Headphones', 'Watch',
  
  // Others
  'Star', 'Bell', 'AlertCircle', 'HelpCircle', 'Settings', 'Shield', 'Lock',
  'FileText', 'Briefcase', 'Calendar', 'Clock', 'Search', 'MoreHorizontal'
].sort();

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  modal?: boolean;
}

export function IconPicker({ value, onChange, modal = false }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedIcon = value;

  function IconGrid({ onSelect }: { onSelect: (icon: string) => void }) {
    const [search, setSearch] = React.useState('');
    
    const filteredIcons = ICON_NAMES.filter(icon => 
      icon.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-[400px]">
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        autoFocus
                        placeholder="Buscar ícone..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-6 gap-2">
                    {filteredIcons.map((iconName) => (
                        <button
                            key={iconName}
                            type="button"
                            onClick={() => onSelect(iconName)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all aspect-square",
                                selectedIcon === iconName 
                                    ? "bg-primary/10 text-primary ring-2 ring-primary" 
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                            title={iconName}
                        >
                            <Icon name={iconName} className="h-6 w-6" />
                        </button>
                    ))}
                    
                    {filteredIcons.length === 0 && (
                        <div className="col-span-6 text-center py-8 text-slate-400 text-sm">
                            Nenhum ícone encontrado
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  }

  if (modal) {
      return (
          <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 px-3 text-left font-normal"
                  >
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            {selectedIcon ? <Icon name={selectedIcon} className="h-5 w-5" /> : <Search className="h-4 w-4" />}
                        </div>
                        <span className="flex-1 text-slate-600 dark:text-slate-300">
                            {selectedIcon || 'Selecionar ícone'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                     </div>
                  </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-[440px]">
                  <DialogHeader className="p-4 border-b">
                      <DialogTitle>Selecionar Ícone</DialogTitle>
                  </DialogHeader>
                  <IconGrid onSelect={(icon) => { onChange(icon); setOpen(false); }} />
              </DialogContent>
          </Dialog>
      )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open}
            className="w-full justify-between h-auto py-2 px-3"
        >
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {selectedIcon ? <Icon name={selectedIcon} className="h-5 w-5" /> : <Search className="h-4 w-4" />}
                </div>
                <span>{selectedIcon || 'Selecionar' }</span>
             </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <IconGrid onSelect={(icon) => { onChange(icon); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}
