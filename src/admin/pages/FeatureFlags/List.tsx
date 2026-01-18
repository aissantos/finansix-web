import React from 'react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { FeatureFlagCard } from './FeatureFlagCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/admin/hooks/usePermissions';

export function FeatureFlagsListPage() {
    const { flags, isLoading, error, updateFlag } = useFeatureFlags();
    const { can } = usePermissions();

    if (isLoading) return <div className="p-8">Carregando flags...</div>;
    if (error) return <div className="p-8 text-red-500">Erro ao carregar flags: {(error as Error).message}</div>;

    const canManage = can('MANAGE_FEATURE_FLAGS');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
                    <p className="text-muted-foreground">Gerencie o lançamento de funcionalidades e experimentação.</p>
                </div>
                 {canManage && (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Flag
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {flags?.map((flag) => (
                    <FeatureFlagCard 
                        key={flag.id} 
                        flag={flag} 
                        onUpdate={(params) => updateFlag(params)}
                        canEdit={canManage}
                    />
                ))}
                {flags?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        Nenhuma feature flag encontrada.
                    </div>
                )}
            </div>
        </div>
    );
}
