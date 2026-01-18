import React from 'react';
import { FeatureFlag } from '../../hooks/useFeatureFlags';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, AlertTriangle } from 'lucide-react';

interface FeatureFlagCardProps {
    flag: FeatureFlag;
    onUpdate: (params: { id: string; isEnabled?: boolean; rolloutPercentage?: number; targetSegment?: string }) => void;
    canEdit: boolean;
}

export function FeatureFlagCard({ flag, onUpdate, canEdit }: FeatureFlagCardProps) {
    const handleToggle = (checked: boolean) => {
        onUpdate({ id: flag.id, isEnabled: checked });
    };

    const handleRolloutChange = (value: number[]) => {
        onUpdate({ id: flag.id, rolloutPercentage: value[0] });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        {flag.name}
                        {flag.target_segment && (
                             <Badge variant="outline" className="text-xs font-normal">
                                 {flag.target_segment}
                             </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>{flag.description}</CardDescription>
                </div>
                <Switch 
                    checked={flag.is_enabled} 
                    onCheckedChange={handleToggle}
                    disabled={!canEdit}
                />
            </CardHeader>
            <CardContent>
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> Rollout
                            </span>
                            <span className="font-mono">{flag.rollout_percentage ?? 0}%</span>
                        </div>
                        <Slider 
                            value={[flag.rollout_percentage || 0]} 
                            max={100} 
                            step={5} 
                            onValueChange={handleRolloutChange}
                            disabled={!canEdit || !flag.is_enabled}
                            className={!flag.is_enabled ? 'opacity-50' : ''}
                        />
                    </div>
                    
                    {flag.rollout_percentage !== null && flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                         <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 dark:text-yellow-400 p-2 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Parcialmente habilitado para {flag.rollout_percentage}% dos usuários.</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
