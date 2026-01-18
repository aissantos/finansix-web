import { useState } from 'react';
import { useSystemSettings, useUpdateSystemSetting, type SystemSetting } from '../hooks/useSystemSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function SettingsPage() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const { toast } = useToast();
  
  // Local state for edits
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleUpdate = async (key: string, value: any) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      setEditingValues((prev) => {
        const next = { ...prev };
        delete next[key]; // Clear edit state
        return next;
      });
      toast({ title: 'Configuração atualizada com sucesso' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar configuração' });
    }
  };

  const handleValueChange = (key: string, value: any) => {
    setEditingValues((prev) => ({ ...prev, [key]: value }));
  };

  // Group settings
  const groupedSettings = settings?.reduce((acc, setting) => {
    const group = setting.group || 'general';
    if (!acc[group]) acc[group] = [];
    acc[group].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>) || {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>

      {Object.entries(groupedSettings).map(([group, groupSettings]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="capitalize">{group.replace('_', ' ')}</CardTitle>
            <CardDescription>Gerencie as configurações do módulo {group}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupSettings.map((setting) => {
              const currentValue = editingValues[setting.key] ?? setting.value;
              const isDirty = editingValues[setting.key] !== undefined && editingValues[setting.key] !== setting.value;

              return (
                <div key={setting.key} className="flex items-center justify-between py-4 border-b last:border-0">
                  <div className="space-y-1 w-1/2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono text-sm">{setting.key}</span>
                      {setting.is_public && <Badge variant="secondary" className="text-xs">Public</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 w-1/2 justify-end">
                    {setting.type === 'boolean' ? (
                      <Switch
                        checked={!!currentValue}
                        onCheckedChange={(checked) => handleUpdate(setting.key, checked)}
                        disabled={updateSetting.isPending}
                      />
                    ) : (
                      <div className="flex items-center gap-2 w-full max-w-sm">
                        <Input
                          type={setting.type === 'number' ? 'number' : 'text'}
                          value={currentValue ?? ''}
                          onChange={(e) => {
                            const val = setting.type === 'number' ? Number(e.target.value) : e.target.value;
                            handleValueChange(setting.key, val);
                          }}
                        />
                        {isDirty && (
                          <Button size="icon" onClick={() => handleUpdate(setting.key, currentValue)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
